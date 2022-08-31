var pw = require("./pw.js");
var message = require("./message.js");

//express
var express = require("express");
var app = express();
const fs = require('fs');
const port = 443;

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

//サーバ立ち上げ
const server = require('https').createServer({
  //証明書
  key: fs.readFileSync(pw.key_path),
  cert: fs.readFileSync(pw.cert_path),  
}, app);

//Line関連
const line = require('@line/bot-sdk');
const crypto = require('crypto');

const config = {
    channelAccessToken: pw.line_channelAccessToken,
    channelSecret: pw.line_channelSecret
}
const client = new line.Client(config);

//MySQL
const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'database-1.c0gwlsggxfl3.ap-northeast-1.rds.amazonaws.com',
  user: 'admin',
  password: pw.db_pw,
});
connection.query(`use toinfes`);

//グローバル一時変数
var user_status = Array(); //入力待ち状態-ここに値が入っている場合、次の入力の解釈を変える

var username_tmp = Array(); //ユーザー名設定対話中の一時変数

var usergrade_tmp = Array(); //クラス設定対話中の一時変数

var userclass_tmp = Array(); //クラス設定対話中の一時変数

//定数
const flex_template = {
  type:"flex",
  altText:"this is a flex msg",
  contents:{}
 }
Object.freeze(flex_template);


//処理系ここから

function sign_check(req,res){
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

//status check
app.get("/api",(req,res) => {
  //DB
  connection.connect((err) => {
    if (err) {
      console.log('error connecting: ' + err.stack);
      res.send('DB : ' + err.stack);
      return;
    }
      console.log('success');
      res.send('DB : success');
    });
});

//
app.get("/api/user/:userId",(req,res) => {
  connection.query(`SELECT * FROM users where userId = '${req.params["userId"]}';`,(error, results) => {
      console.log(results[0]);
      res.json(results[0]);
    }
  );
});

app.get("/api/user-all",(req,res) => {
  connection.query(`SELECT * FROM users;`,(error, results) => {
      console.log(results);
      res.json(results);
    }
  );
});

app.post("/api",(req,res) => {
  //LINE用
  //署名検証
  sign_check(req,res);
  if(req.body.events.length == 0){
    //LINE側からの疎通チェック
    console.log("webhook check ok");
    res.sendStatus(200);
    return;
  }
  const event = req.body.events[0];
  console.log(event);
  if(user_status[event.source.userId]){
    branch(event);
    return;
  }
  if(event.type == "follow"){
    follow(event);
    return;
  }
  const text = event.message.text;
  if(text == "ランキング"){
    get_rank(event);
    return;
  }
  //どれでもない場合、キーワードが入力されたものとして扱う
});

function follow (event){
  //友達追加されたときに発生
  //ブロック解除でも同じのが飛ぶので考慮

  //DBにユーザーデータが存在するか検証
  connection.query(`SELECT * from users where userId = '${event.source.userId}';`,(error,results) => {
    console.log(results);
    if(results.length!=0) return;
    else{
      client.replyMessage(event.replyToken, {type:'text',text:message.add_friend});
      user_status[event.source.userId] = "waitinputname";
    }
  });
}

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

function inputname(event){
  var return_obj = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
  return_obj.contents = Object.assign({}, JSON.parse(JSON.stringify(message.input_name)));;
  username_tmp[event.source.userId] = event.message.text;
  //console.log(return_obj);
  //console.log(return_obj.contents);
  return_obj.contents.body.contents[0].text = event.message.text + return_obj.contents.body.contents[0].text;
  //console.log("msg:"+return_obj.contents.body.contents[0].text);
  client.replyMessage(event.replyToken, return_obj);
  user_status[event.source.userId] = "checkinputname";
  //console.log("f:"+JSON.stringify(flex_template));
}

function checkinputname(event){
  if(event.message.text == "はい"){
    user_status[event.source.userId] = "waitinputgrade";

    var return_obj = Object.assign({}, JSON.parse(JSON.stringify(flex_template)));
    return_obj.contents = Object.assign({}, JSON.parse(JSON.stringify(message.ask_grade)));
    client.replyMessage(event.replyToken, return_obj);

    //dbたたかない　あとでけす
    //connection.query(`insert into users value('${event.source.userId}','${username_tmp[event.source.userId]}',0,0);`,(error,results) => {
    //  if(results){
    //    client.replyMessage(event.replyToken, {type:'text',text:message.input_name_done});
    //    user_status[event.source.userId] = null;
    //  }
    //});
  }else if(event.message.text == "いいえ"){
    //もっかい入力させる
    client.replyMessage(event.replyToken, {type:'text',text:message.add_friend});
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
      client.replyMessage(event.replyToken, {type:'text',text:message.ask_grade});
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
    connection.query(`insert into users value('${event.source.userId}','${username_tmp[event.source.userId]}',0,${userclass});`,(error,results) => {
      if(results){
        client.replyMessage(event.replyToken, {type:'text',text:message.input_done});
        user_status[event.source.userId] = null;
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

function get_rank(event){
  //ランキング取得
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

app.post("/api/read-spreadsheet",(req,res) => {
  //スプシ読み込み→DBに投げる
});

server.listen(port, () => console.log(`Listen : port ${port}!`));