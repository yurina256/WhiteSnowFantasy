//require
var config = require("./config.js");
var message = require("./message.js");
var request = require('request');
var fs = require('fs');

//express
var express = require("express");
var app = express();
const port = 443;

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

//サーバ立ち上げ
const server = require('https').createServer({
  //証明書
  key: fs.readFileSync(config.key_path),
  cert: fs.readFileSync(config.cert_path),  
}, app);

//Line関連
const line = require('@line/bot-sdk');
const crypto = require('crypto');


const line_config = {
    channelAccessToken: config.line_channelAccessToken,
    channelSecret: config.line_channelSecret
}
const client = new line.Client(line_config);

//MySQL
const mysql = require('mysql');
const { event_template } = require("./message.js");
const connection = mysql.createConnection({
  host: config.db_endpoint,
  user: config.db_user,
  password: config.db_pw,
});
connection.query(`use ${config.table}`);

//グローバル一時変数,定数
var user_status = Array(); //入力待ち状態-ここに値が入っている場合、次の入力の解釈を変える

var user_registered = Array(); //ユーザーが登録済か 更新しない

var username_tmp = Array(); //ユーザー名設定対話中の一時変数

var usergrade_tmp = Array(); //クラス設定対話中の一時変数

var userclass_tmp = Array(); //クラス設定対話中の一時変数

var count_mystery;//謎数
var count_treasure;//宝数
const count_class = 16;

//定数
const flex_template = {
  type:"flex",
  altText:"this is a flex msg",
  contents:{}
 }
Object.freeze(flex_template);

//起動時処理
//有効なユーザーの一覧を持ってくる
connection.query(`SELECT userId FROM users;`,(error, results) => {
  for(var i=0;i<results.length;i++){
    user_registered[results[i].userId] = true;
  }
  console.log("initialisation success");
  console.log(user_registered);
}
);
//謎の数を持ってくる
connection.query(`SELECT count(*) FROM events where type = 0;`,(error, results) => {
  count_mystery =  results[0][Object.keys(results[0])[0]]+1;
});
//宝の数を持ってくる
connection.query(`SELECT count(*) FROM events where type = 1;`,(error, results) => {
  count_treasure =  results[0][Object.keys(results[0])[0]]+1;
});
//クラスをリセット
connection.query(`DELETE from class;`,(error, results) => {
  for(var i=0;i<count_class;i++){
    connection.query(`insert into class value(?,0);`,[i]);
  }
});

//処理系ここから

function sign_check(req,res,config){
  const signature = crypto.createHmac("SHA256", config['channelSecret']).update(JSON.stringify(req.body)).digest("base64");
  const checkHeader = req.headers['x-line-signature'];
  console.log(checkHeader);
  if(signature !== checkHeader){
    console.log("sign check error");
    res.sendStatus(401);
  }
  else console.log('sign check succees');
}

app.get("/",(req,res) => {
  console.log("request : get -> /");
  console.log(req.ip);
  console.log(req.body);
  res.sendStatus(200);
});

//振り分け
app.post("/api",(req,res) => {
  //LINE用
  //署名検証
  //console.log("input");
  sign_check(req,res,line_config);
  if(req.body.events.length == 0){
    //LINE側からの疎通チェック
    console.log("webhook check ok");
    res.sendStatus(200);
    return;
  }
  const event = req.body.events[0];

  if(event.type == "message"){

    //簡易バリデーション
    var regexp = /\`|\"|\'/;
    if(regexp.test(event.message.text)){
      client.replyMessage(event.replyToken,{type:'text',text:"使用できない記号が含まれています！"});
      return;
    }
    //対話中ならば優先的に見る
    if(user_status[event.source.userId]){
      branch(event);
      return;
    }
    //未登録ユーザーかチェック
    if(!user_registered[event.source.userId]){
      follow(event,true);
      return;
    }
  }else{
    //友達追加時処理
    if(event.type == "follow" && !user_status[event.source.userId]){
      follow(event);
      return;
    }
    return;//どれでもなければ破棄
  }

  const text = event.message.text;
  if(["ランキング","ステータス","進行状況","狩人ルートのヒントを見る","小人ルートのヒントを見る","従者ルートのヒントを見る"].indexOf(text) != -1){
    switch(text){
      case "ランキング":
        get_rank(event);
        break;
      case "クラスランキング"://壊れたのでなおす
        get_rank_class(event);
        break;
      case "ステータス":
        get_status(event);
        break;
      case "進行状況":
        get_progress(event);
        break;
      case "狩人ルートのヒントを見る":
        get_hint(event,0);
        break;
      case "小人ルートのヒントを見る":
        get_hint(event,1);
        break;
      case "従者ルートのヒントを見る":
        get_hint(event,2);
        break;
    }
  }else{
    input_message(event);
  }
  //どれでもない場合、キーワードが入力されたものとして扱う
});

function branch(event){//user_statusが設定されている状態の場合(=対話中の場合)の振り分け
  const status = user_status[event.source.userId];
  //console.log("r:"+user_status[event.source.userId]);
  switch(status){
    case "waitinputname":
      inputname(event);
      break;
    case "checkinputname":
      checkinputname(event);
      break;
    case "waitinputgrade":
      inputgrade(event);
      break;
    case "waitinputclass":
      inputclass(event);
      break;
    case "checkinputclass":
      checkinputclass(event);
      break;
  }
}

// ユーザー登録
function follow (event,flag = false){
  //友達追加されたときに発生
  //DBにユーザーデータが存在するか検証(存在する場合、ブロック解除なので無視)
  connection.query(`SELECT * from users where userId = '${event.source.userId}';`,(error,results) => {
    console.log(results);
    if(results.length!=0) return;
    else{
      if(flag){
        //友達登録済 && ユーザーネーム未登録ユーザー向け処理
        client.replyMessage(event.replyToken,[{type:'text',text:message.not_registed},{type:'text',text:message.ask_name}]);
      }else{
        //新規友達追加時処理
        client.replyMessage(event.replyToken,[{type:'text',text:message.add_friend},{type:'text',text:message.ask_name}]);
      }
      user_status[event.source.userId] = "waitinputname";
    }
  });
}

function inputname(event){
  var return_obj = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
  return_obj.contents = Object.assign({}, JSON.parse(JSON.stringify(message.input_name)));;
  username_tmp[event.source.userId] = event.message.text;
  return_obj.contents.body.contents[0].text = event.message.text + return_obj.contents.body.contents[0].text;
  client.replyMessage(event.replyToken, return_obj);
  user_status[event.source.userId] = "checkinputname";
}

function checkinputname(event){
  if(event.message.text == "はい"){
    user_status[event.source.userId] = "waitinputgrade";

    var return_obj = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
    return_obj.contents = Object.assign({}, JSON.parse(JSON.stringify(message.ask_grade)));
    client.replyMessage(event.replyToken, return_obj);
  }else if(event.message.text == "いいえ"){
    //もっかい入力させる
    client.replyMessage(event.replyToken, {type:'text',text:message.ask_name});
    user_status[event.source.userId] = "waitinputname";
  }else{
    //inputname()で出したのを再表示
    var return_obj = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
    return_obj.contents = Object.assign({}, JSON.parse(JSON.stringify(message.input_name)));
    return_obj.contents.body.contents[0].text = username_tmp[event.source.userId] + return_obj.contents.body.contents[0].text;
    client.replyMessage(event.replyToken, return_obj);
  }
}

function inputgrade(event){
  switch(event.message.text){
    case "1年":
    case "2年":
    case "3年":
      //データを格納してクラスを聞く
      usergrade_tmp[event.source.userId] = event.message.text;
      user_status[event.source.userId] = "waitinputclass";

      var return_obj = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
      return_obj.contents = Object.assign({}, JSON.parse(JSON.stringify(message.ask_class)));
      client.replyMessage(event.replyToken, return_obj);
      break;
    case "教職員/外来":
      //データを格納してチェックへ
      usergrade_tmp[event.source.userId] = event.message.text;
      userclass_tmp[event.source.userId] = "";//クラスは空文字列扱い
      user_status[event.source.userId] = "checkinputclass";
      
      var return_obj = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
      return_obj.contents = Object.assign({}, JSON.parse(JSON.stringify(message.check_class)));
      return_obj.contents.body.contents[0].text = usergrade_tmp[event.source.userId] + userclass_tmp[event.source.userId] + return_obj.contents.body.contents[0].text;
      client.replyMessage(event.replyToken, return_obj);
      break;
    default:
      //再送
      var return_obj = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
      return_obj.contents = Object.assign({}, JSON.parse(JSON.stringify(message.ask_grade)));
      client.replyMessage(event.replyToken, return_obj);
  }
}

function inputclass(event){
  switch(event.message.text){
    case "1組":
    case "2組":
    case "3組":
    case "4組":
    case "5組":
    case "6組":
      userclass_tmp[event.source.userId] = event.message.text;
      user_status[event.source.userId] = "checkinputclass";

      var return_obj = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
      return_obj.contents = Object.assign({}, JSON.parse(JSON.stringify(message.check_class)));
      return_obj.contents.body.contents[0].text = usergrade_tmp[event.source.userId] + userclass_tmp[event.source.userId] + return_obj.contents.body.contents[0].text;
      client.replyMessage(event.replyToken, return_obj);
      break;
    default:
      //再送処理
      var return_obj = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
      return_obj.contents = Object.assign({}, JSON.parse(JSON.stringify(message.ask_class)));
      client.replyMessage(event.replyToken, return_obj);
  }
}

function checkinputclass(event){ 
  if(event.message.text == "はい"){
    //dbたたく
    const classArr = ["教職員/外来","1年1組","1年2組","1年3組","1年4組","1年5組","1年6組","2年1組","2年2組","2年3組","2年4組","2年5組","2年6組","3年1組","3年2組","3年3組","3年4組","3年5組","3年6組"];
    const userclass = classArr.indexOf(usergrade_tmp[event.source.userId]+userclass_tmp[event.source.userId]);
    connection.query(`insert into users value('${event.source.userId}','${username_tmp[event.source.userId]}',1,${userclass},1,6,10);`,(error,results) => {
      if(results){
        client.replyMessage(event.replyToken, {type:'text',text:message.input_done});
        user_status[event.source.userId] = null;
        user_registered[event.source.userId] = true;
      }
    });
  }else if(event.message.text == "いいえ"){
    //inputgrade()にもどる
    user_status[event.source.userId] = "waitinputgrade";

    var return_obj = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
    return_obj.contents = Object.assign({}, JSON.parse(JSON.stringify(message.ask_grade)));
    client.replyMessage(event.replyToken, return_obj);
  }else{
    //inputclass()で出したのを再表示
    var return_obj = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
    return_obj.contents = Object.assign({}, JSON.parse(JSON.stringify(message.check_class)));
    return_obj.contents.body.contents[0].text = usergrade_tmp[event.source.userId] + userclass_tmp[event.source.userId] + return_obj.contents.body.contents[0].text;
    client.replyMessage(event.replyToken, return_obj);
  }
}

//ランキング(全ユーザー)取得
function get_rank(event){
  connection.query(`select * from users order by level desc;`,(error,results) => {
    if(results){
      var return_obj = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
      return_obj.contents = Object.assign({}, JSON.parse(JSON.stringify(message.get_rank)));
      for(var i=0;i<3;i++){
        return_obj.contents.body.contents[1].contents[i].contents[1].text = results[i].userName;
        return_obj.contents.body.contents[1].contents[i].contents[2].text = "Lv"+String(results[i].level);
      }
      client.replyMessage(event.replyToken, return_obj);
    }
  });
}

//ランキング(クラス毎)取得
function get_rank_class(event){
  connection.query(`select * from class where id != 0 order by level desc;`,(error,results) => {
    if(results){
      var return_obj = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
      return_obj.contents = Object.assign({}, JSON.parse(JSON.stringify(message.get_rank)));
      for(var i=0;i<3;i++){
        return_obj.contents.body.contents[1].contents[i].contents[1].text = `${Math.ceil(results[i].id/6)}-${(results[i].id+1)%6 + 1}`
        return_obj.contents.body.contents[1].contents[i].contents[2].text = "Lv"+String(results[i].level);
      }
      client.replyMessage(event.replyToken, return_obj);
    }
  });
}

//キーワード送信
function input_message(event){
  //キーワード受容判定
  const text = event.message.text.trim();
  console.log(text);
  connection.query(`select * from events where keyword = '${text}' OR keyword2 = '${text}';`,(error,results) => {
    if(results.length!=0){
      if(results[0].permise_1){
        connection.query(`select * from log where userId ='${event.source.userId}' AND eventId = '${results[0].permise_1}' ;`,(error2,results2) => {
          if(results2.length==0){
            client.replyMessage(event.replyToken,{type:'text',text:"これは違うようだ。もう一度考えてみよう。"});
          }else do_event(event,results[0]);          //発火(前提条件を満たす)
        });
      }else{
        //発火(前提条件なし)
        console.log("hoge");
        do_event(event,results[0]);
      }
    }else{
      client.replyMessage(event.replyToken,{type:'text',text:"これは違うようだ。もう一度考えてみよう。"});
    }
  });
}

//イベント実行
function do_event(event,event_data){
  //既に達成したイベントか判定
  connection.query(`select * from log where userId = '${event.source.userId}' and eventId = '${event_data.eventId}';`,(error,results) => {
    if(results.length!=0){
      client.replyMessage(event.replyToken, {type:'text',text:message.used_keyword});
      return;
    }
    //Lv加算
    connection.query(`update users set level = level + '${event_data.level}' where userId = '${event.source.userId}';`);
    //Lv加算(class)
    connection.query(`update class set level = level + '${event_data.level}' where id = (select class from users where userId = '${event.source.userId}');`);
    //ログ追加
    connection.query(`insert into log value(null,'${event.source.userId}','${event_data.eventId}','${event_data.type}',cast( now() as datetime));`,(error,results) => {});
    //メッセージを書き換えて投げる
    var return_obj = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
    return_obj.contents = Object.assign({}, JSON.parse(JSON.stringify(message.event_template)));
    return_obj.contents.body.contents[0].text = event_data.message;
    return_obj.contents.body.contents[1].text = `レベルが${event_data.level}上がった！`;
    return_obj.contents.hero.url = message.img_source + event_data.image;
    console.log(return_obj.contents.hero.url);
    if(event_data.type == 0){
      if(event_data.eventId != 18){
        return_obj.contents.footer = message.event_footer;
        return_obj.contents.footer.contents[0].action.uri = event_data.next_link;
      }
      //暫定実装
      const route_a = [1,15,2,3,4,5,19,0];
      const a_point = route_a.indexOf(event_data.eventId);
      if(a_point != -1){
        connection.query(`update users set route_a_next = ${route_a[a_point+1]} where userId = '${event.source.userId}';`);
      }

      const route_b = [6,7,8,9,0];
      const b_point = route_b.indexOf(event_data.eventId);
      if(b_point != -1){
        connection.query(`update users set route_b_next = ${route_b[b_point+1]} where userId = '${event.source.userId}';`);
      }

      const route_c = [10,11,12,13,14,0];
      const c_point = route_c.indexOf(event_data.eventId);
      if(c_point != -1){
        connection.query(`update users set route_c_next = ${route_c[c_point+1]} where userId = '${event.source.userId}';`);
      }
    }
    const add_obj = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
    add_obj.contents = Object.assign({}, JSON.parse(JSON.stringify(message.last_stage)));

    if([19,9,14].indexOf(event_data.eventId) == -1){
      client.replyMessage(event.replyToken,return_obj);
      return;
    }
    connection.query(`select * from users where userid = ?;`,[event.source.userId],(error,results_user) => {
      if(results_user[0].route_a_next == 0 && results_user[0].route_b_next == 0 && results_user[0].route_c_next == 0){
        client.replyMessage(event.replyToken,[return_obj,add_obj]);
      }else{
        client.replyMessage(event.replyToken,return_obj);
      }
    });

  });
}

//ユーザーデータ取得
function get_status(event){
  connection.query(`select * from users where userid = ?;`,[event.source.userId],(error,results) => {
    const name = results[0].userName;
    const guild = (results[0].class == 0)?"None":`${Math.ceil(results[0].class/6)}-${(results[0].class-1)%6 + 1}`;
    const level = String(results[0].level);
    connection.query(`select count(level > (select level from users where userId = ?) or null) from users;`,[event.source.userId],(error,results2) => {
      const rank = "#"+String(results2[0][Object.keys(results2[0])[0]]+1);
      connection.query(`select count(type = 0 or null) as mystery,count(type = 1 or null) as treasure from log where userId = ?;`,[event.source.userId],(error,results3) => {
        const mystery_percent = Math.ceil(results3[0].mystery/count_mystery * 100) + "%";
        const treasure_percent = Math.ceil(results3[0].treasure/count_treasure * 100)+ "%";
        
        //組み立て
        var return_obj = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
        return_obj.contents = Object.assign({}, JSON.parse(JSON.stringify(message.user_status)));
        return_obj.contents.header.contents[0].contents[1].text = name;
        return_obj.contents.header.contents[1].contents[0].contents[1].text = guild;
        return_obj.contents.header.contents[1].contents[1].contents[1].text = level;
        return_obj.contents.header.contents[1].contents[2].contents[1].text = rank;
        return_obj.contents.body.contents[1].text = mystery_percent;
        return_obj.contents.body.contents[2].contents[0].width = mystery_percent;
        if(mystery_percent == "100%")return_obj.contents.body.contents[1].text = message.progressbar_compleat;
        return_obj.contents.body.contents[4].text = treasure_percent;
        return_obj.contents.body.contents[5].contents[0].width = treasure_percent;
        if(treasure_percent == "100%")return_obj.contents.body.contents[4].text = message.progressbar_compleat;
        client.replyMessage(event.replyToken,return_obj);
      });
    });
  });
}


function get_progress(event){
  //進捗状況取得 -　動くの優先なので後で書き直す
  var return_herder = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
  return_herder.contents = Object.assign({}, JSON.parse(JSON.stringify(message.continue_header)));
  connection.query(`select * from users where userId = ?;`,[event.source.userId],(error,results) => {
    console.log(results);
    var return_route_1 = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
    return_route_1.contents = Object.assign({}, JSON.parse(JSON.stringify(message.continue_route)));
    return_route_1.contents.body.contents[0].text = "狩人ルート";
    connection.query(`select * from events where eventId = ?;`,[results[0].route_a_next],(error,results2) => {
      if(results[0].route_a_next != 0){
        return_route_1.contents.body.contents[1].text = results2[0].name;
        return_route_1.contents.footer.contents[0].action.uri = results2[0].link;
        return_route_1.contents.footer.contents[1].action.text = "狩人ルートのヒントを見る";
      }else{
        return_route_1.contents.body.contents[1].text = "complete!"
        return_route_1.contents.footer = null;
      }
      var return_route_2 = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
      return_route_2.contents = Object.assign({}, JSON.parse(JSON.stringify(message.continue_route)));
      return_route_2.contents.body.contents[0].text = "小人ルート";
      connection.query(`select * from events where eventId = ?;`,[results[0].route_b_next],(error,results3) => {
        if(results[0].route_b_next != 0){
          return_route_2.contents.body.contents[1].text = results3[0].name;
          return_route_2.contents.footer.contents[0].action.uri = results3[0].link;
          return_route_2.contents.footer.contents[1].action.text = "小人ルートのヒントを見る";
        }else{
          return_route_2.contents.body.contents[1].text = "complete!"
          return_route_2.contents.footer = null;
        }
    
    
      var return_route_3 = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
      return_route_3.contents = Object.assign({}, JSON.parse(JSON.stringify(message.continue_route)));
      return_route_3.contents.body.contents[0].text = "従者ルート";
      connection.query(`select * from events where eventId = ?;`,[results[0].route_c_next],(error,results4) => {
        if(results[0].route_c_next != 0){
          return_route_3.contents.body.contents[1].text = results4[0].name;
          return_route_3.contents.footer.contents[0].action.uri = results4[0].link;
          return_route_3.contents.footer.contents[1].action.text = "従者ルートのヒントを見る";
        }else{
          return_route_3.contents.body.contents[1].text = "complete!"
          return_route_3.contents.footer = null;
        }
        client.replyMessage(event.replyToken,[return_herder,return_route_1,return_route_2,return_route_3]);
      });
      });
    });
  });
  return;
}

function get_hint(event,route){

  connection.query(`select * from users where userId = ?;`,[event.source.userId],(error,results) => {
    switch(route){
      case 0:
        connection.query(`select * from events where eventId = ?;`,[results[0].route_a_next],(error,results2) => {
          client.replyMessage(event.replyToken,{type:'text',text:results2[0].hint});
        });
      break;
      case 1:
        connection.query(`select * from events where eventId = ?;`,[results[0].route_b_next],(error,results2) => {
          client.replyMessage(event.replyToken,{type:'text',text:results2[0].hint});
        });
      break;
      case 2:
        connection.query(`select * from events where eventId = ?;`,[results[0].route_c_next],(error,results2) => {
          client.replyMessage(event.replyToken,{type:'text',text:results2[0].hint});
        });
      break;
    }   
  });
}

app.post("/api/read-spreadsheet",(req,res) => {
  //スプシ読み込み→DBに投げる
  var options = {
    url: config.sheet_link,
    method: 'GET'
  }
  request(options, function (error, response, body) {
    connection.query(`SET foreign_key_checks = 0;`);
    connection.query(`DELETE from events;`);

    input = JSON.parse(body).values;
    //console.log(input);
    for(var i=1;i<input.length;i++){
      const no = input[i][0];
      if(Number.isNaN(parseInt(no))) continue;
      const type      = ["謎解き","宝","その他"].indexOf(input[i][2]);
      if(type == -1) continue; 
      const msg       = input[i][3] || "";
      const lv        = input[i][4] || "";
      var permise_1 = (input[i][5] || "").split(",")[0];
      if(permise_1 == "") permise_1 = "null";
      var permise_2 = (input[i][5] || "").split(",")[1];
      if(permise_2 == "" || permise_2 == undefined) permise_2 = "null";
      var permise_3 = (input[i][5] || "").split(",")[2];
      if(permise_3 == "" || permise_3 == undefined) permise_3 = "null";
      const keyword   = input[i][6] || "";
      const keyword2   = input[i][7] || "";
      const image     = input[i][9] || "";
      const next_link      = input[i][10] || "";
      const hint      = input[i][11] || "";
      const name      = input[i][1] || "";
      const link      = input[i][12] || "";
      console.log(`insert into events value('${no}','${type}','${msg}','${lv}',${permise_1},${permise_2},${permise_3},'${keyword}','${keyword2}','${image}','${next_link}','${name}','${hint}','${link}');`);
      connection.query(`insert into events value('${no}','${type}','${msg}','${lv}',${permise_1},${permise_2},${permise_3},'${keyword}','${keyword2}','${image}','${next_link}','${name}','${hint}','${link}');`);
    }
    res.sendStatus(200);
  })
});

//静的ファイル配信
app.use(express.static('public'));

// 運営アカウント #############################################################################################################

const line_op_config = {
  channelAccessToken: config.line_op_channelAccessToken,
  channelSecret: config.line_op_channelSecret
}
const client_op = new line.Client(line_op_config);

var op_user_status = Array(); 
var broadcast_tmp = Array(); //ユーザーごとに持つ

app.post("/operation",(req,res) => {
  //LINE用
  //署名検証
  sign_check(req,res,line_op_config);
  console.log("admin_req");
  if(req.body.events.length == 0){
    //LINE側からの疎通チェック
    console.log("webhook check ok");
    res.sendStatus(200);
    return;
  }
  const event = req.body.events[0];
  if(event.type != "message") return;

  if(op_user_status[event.source.userId]){
    //op_branch
  }

  const text = event.message.text;

  if(op_user_status[event.source.userId] == "waitbroadcasttext"){
    broadcast_tmp[event.source.userId] = event.message.text;
    var return_obj = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
    return_obj.contents = Object.assign({}, JSON.parse(JSON.stringify(message.check_class)));
    return_obj.contents.body.contents[0].text = "本当によいですか？";
    client_op.replyMessage(event.replyToken, return_obj);
    op_user_status[event.source.userId] = "checkbroadcasttext";
    return;
  };
  if(op_user_status[event.source.userId] == "checkbroadcasttext"){
    if(text == "はい"){
      client.broadcast({type:'text',text:broadcast_tmp[event.source.userId]});
      client_op.replyMessage(event.replyToken,{type:'text',text:"実行しました。"});
    }else{
      client_op.replyMessage(event.replyToken,{type:'text',text:"実行を中止します。"});
    }
    broadcast_tmp[event.source.userId] = null;
    op_user_status[event.source.userId] = null;
    return;
  }
  if(op_user_status[event.source.userId] == "checkreadsheet"){
    if(text == "はい"){
      read_sheet();
      client_op.replyMessage(event.replyToken,{type:'text',text:"実行しました。"});
    }else{
      client_op.replyMessage(event.replyToken,{type:'text',text:"実行を中止します。"});
    }
    op_user_status[event.source.userId] = null;
    return;
  };

  if(text == "全員にテキスト配信"){
    client_op.replyMessage(event.replyToken,{type:'text',text:"配信するテキストを入力してください"});
    op_user_status[event.source.userId] = "waitbroadcasttext";
    broadcast_tmp[event.source.userId] = text;
    return;
  }
  if(text == "スプレッドシート読み込み"){
    var return_obj = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
    return_obj.contents = Object.assign({}, JSON.parse(JSON.stringify(message.check_class)));
    return_obj.contents.body.contents[0].text = "現在サーバー側にあるイベントデータは削除されます。本当によいですか？";
    client_op.replyMessage(event.replyToken,return_obj);
    op_user_status[event.source.userId] = "checkreadsheet";
  }
});

function read_sheet(){
    //スプシ読み込み→DBに投げる
    var options = {
      url: config.sheet_next_link,
      method: 'GET'
    }
    request(options, function (error, response, body) {
      connection.query(`SET foreign_key_checks = 0;`);
      connection.query(`DELETE from events;`);
      input = JSON.parse(body).values;
      console.log(input);
      for(var i=1;i<input.length;i++){
        const no = input[i][0];
        if(Number.isNaN(parseInt(no))) continue;
        const type      = ["謎解き","宝","その他"].indexOf(input[i][2]);
        const msg       = input[i][3] || "";
        const lv        = input[i][4] || "";
        var permise = (input[i][5] || "").split(",")[0];
        if(permise == "") permise = "null";
        const keyword   = input[i][6] || "";
        const keyword2   = input[i][7] || "";
        const image     = input[i][9] || "";
        const next_link      = input[i][10] || "";
        console.log(`insert into events value('${no}','${type}','${msg}','${lv}',${permise},'${keyword}','${keyword2}','${image}','${next_link}');`);
        connection.query(`insert into events value('${no}','${type}','${msg}','${lv}',${permise},'${keyword}','${keyword2}','${image}','${next_link}');`);
      }
    })
    return;
}

server.listen(port, () => console.log(`Listen : port ${port}!`));
