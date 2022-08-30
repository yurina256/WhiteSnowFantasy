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

module.exports = {
    add_friend : "あなたの名前を教えてください！", //友達追加時メッセージ
    input_name : __input_name,
    input_name_done: "登録が完了しました！",
    get_rank : __get_rank
};
//改行は\n