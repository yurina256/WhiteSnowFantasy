const img_source = "https://be.toinfes-api-dev.com/img/";
var fs = require('fs');

const __input_name = {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "さんでよろしいでしょうか？",
          wrap: true
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          style: "link",
          height: "sm",
          action: {
            type: "message",
            label: "はい",
            text: "はい"
          }
        },
        {
          type: "button",
          style: "link",
          height: "sm",
          action: {
            type: "message",
            label: "いいえ",
            text: "いいえ"
          }
        },
        {
          type: "box",
          layout: "vertical",
          contents: [],
          margin: "sm"
        }
      ],
      flex: 0
    }
  }

const __get_rank = {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      action: {
        type: "uri",
        uri: "https://linecorp.com"
      },
      contents: [
        {
          type: "text",
          text: "現在のランキング",
          size: "xl",
          weight: "bold"
        },
        {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "box",
              layout: "baseline",
              contents: [
                {
                  type: "icon",
                  url: "https://img.icons8.com/office/344/medal2--v1.png",
                  position: "relative"
                },
                {
                  type: "text",
                  text: "$10.5",
                  weight: "bold",
                  margin: "sm",
                  flex: 0
                },
                {
                  type: "text",
                  text: "[input lv]",
                  size: "sm",
                  align: "end",
                  color: "#404040"
                }
              ]
            },
            {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "icon",
                    url: "https://img.icons8.com/office/344/medal-second-place.png",
                    position: "relative"
                  },
                  {
                    type: "text",
                    text: "$10.5",
                    weight: "bold",
                    margin: "sm",
                    flex: 0
                  },
                  {
                    type: "text",
                    text: "[input lv]",
                    size: "sm",
                    align: "end",
                    color: "#404040"
                  }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "icon",
                    url: "https://img.icons8.com/office/344/medal2-third-place.png",
                    position: "relative"
                  },
                  {
                    type: "text",
                    text: "$10.5",
                    weight: "bold",
                    margin: "sm",
                    flex: 0
                  },
                  {
                    type: "text",
                    text: "[input lv]",
                    size: "sm",
                    align: "end",
                    color: "#404040"
                  }
                ]
              }
          ]
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#905c44",
          margin: "xxl",
          action: {
            type: "uri",
            label: "詳細",
            uri: "https://linecorp.com"
          }
        }
      ]
    }
  }

const __ask_grade = {
  type: "bubble",
  body: {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "text",
        text: "学年を教えてください！",
        wrap: true
      }
    ]
  },
  footer: {
    type: "box",
    layout: "vertical",
    spacing: "sm",
    contents: [
      {
        type: "button",
        style: "link",
        height: "sm",
        action: {
          type: "message",
          label: "1年",
          text: "1年"
        }
      },
      {
        type: "button",
        style: "link",
        height: "sm",
        action: {
          type: "message",
          label: "2年",
          text: "2年"
        }
      },
      {
        type: "button",
        style: "link",
        height: "sm",
        action: {
          type: "message",
          label: "3年",
          text: "3年"
        }
      },
      {
        type: "button",
        style: "link",
        height: "sm",
        action: {
          type: "message",
          label: "教職員/外来",
          text: "教職員/外来"
        }
      },
      {
        type: "box",
        layout: "vertical",
        contents: [],
        margin: "sm"
      }
    ],
    flex: 0
  }
}

const __ask_class = {
  type: "bubble",
  body: {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "text",
        text: "クラスを教えてください！",
        wrap: true
      }
    ]
  },
  footer: {
    type: "box",
    layout: "vertical",
    spacing: "sm",
    contents: [
      {
        type: "button",
        style: "link",
        height: "sm",
        action: {
          type: "message",
          label: "1組",
          text: "1組"
        }
      },
      {
        type: "button",
        style: "link",
        height: "sm",
        action: {
          type: "message",
          label: "2組",
          text: "2組"
        }
      },
      {
        type: "button",
        style: "link",
        height: "sm",
        action: {
          type: "message",
          label: "3組",
          text: "3組"
        }
      },
      {
        type: "button",
        style: "link",
        height: "sm",
        action: {
          type: "message",
          label: "4組",
          text: "4組"
        }
      },
      {
        type: "button",
        style: "link",
        height: "sm",
        action: {
          type: "message",
          label: "5組",
          text: "5組"
        }
      },
      {
        type: "button",
        style: "link",
        height: "sm",
        action: {
          type: "message",
          label: "6組",
          text: "6組"
        }
      },
      {
        type: "box",
        layout: "vertical",
        contents: [],
        margin: "sm"
      }
    ],
    flex: 0
  }
}

const __check_class = {
  type: "bubble",
  body: {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "text",
        text: "で間違いないですか？",
        wrap: true
      }
    ]
  },
  footer: {
    type: "box",
    layout: "vertical",
    spacing: "sm",
    contents: [
      {
        type: "button",
        style: "link",
        height: "sm",
        action: {
          type: "message",
          label: "はい",
          text: "はい"
        }
      },
      {
        type: "button",
        style: "link",
        height: "sm",
        action: {
          type: "message",
          label: "いいえ",
          text: "いいえ"
        }
      },
      {
        type: "box",
        layout: "vertical",
        contents: [],
        margin: "sm"
      }
    ],
    flex: 0
  }
}

const __event_template = {
  type: "bubble",
  hero: {
    type: "image",
    url: img_source,
    size: "full",
    aspectRatio: "20:13",
    aspectMode: "cover",
    action: {
      type: "uri",
      uri: "http://linecorp.com/"
    }
  },
  body: {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "text",
        text: "[input title]",
        weight: "bold",
        size: "xl"
      },
      {
        type: "text",
        text: "[input text]"
      }
    ]
  }
}

const __event_footer = {
  type: "box",
  layout: "vertical",
  spacing: "sm",
  contents: [
    {
      type: "button",
      style: "link",
      height: "sm",
      action: {
        type: "uri",
        label: "次の謎を開く",
        uri: "localhost"
      }
    }
  ],
  flex: 0
}

module.exports = { 
    not_registed : "ユーザー名の登録がまだのようです！" ,
    add_friend: "友達追加ありがとうございます！",
    ask_name : "あなたの名前を教えてください！", //友達追加時メッセージ
    input_name : __input_name,
    input_done: "登録が完了しました！",
    get_rank : __get_rank,
    ask_grade : __ask_grade,
    ask_class : __ask_class,
    check_class : __check_class,
    event_template : __event_template,
    event_footer : __event_footer,
    used_keyword : "既に達成したイベントです！",
    progressbar_compleat : "Compleat!!",
    user_status : JSON.parse(fs.readFileSync('./flex_templates/user_status.json', 'utf8'))
};
//改行は\n
