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

module.exports = {
    add_friend : "あなたの名前を教えてください！", //友達追加時メッセージ
    input_name : __input_name,
    input_name_done: "登録が完了しました！"
};
//改行は\n