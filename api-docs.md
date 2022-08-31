# API Documents

エンドポイント:`https://toinfes-api-dev.com/api`
データはすべてjson形式で返却されます。

## GET /user/:userId
指定したユーザーIDに該当するユーザーのデータを取得する
### サンプルリクエスト
`GET https://toinfes-api-dev.com/api/user/testuser1`

### 返却値
```json
[
    {
    "userId": "testuser1" , 
    "userName": "田中太郎",
    "level": 10,
    "class": 20
    }
]
```

### 詳細
| 名称     | 形式   | 内容                                 | 
| -------- | ------ | ------------------------------------ | 
| userId   | string | ユーザー識別用の固有の文字列。       | 
| userName | string | ユーザーの表示名(重複の可能性がある) | 
| level    | int    | ユーザーのレベル                     | 
| class    | int    | ユーザーのクラスを表すID             | 

- class IDは、教職員/外来の場合0,その他の場合n年m組は(n-1)*6+mで表されます
- cf:3年3組 => 3x6+3 => 15

## GET /user-all
全ユーザーのデータを取得
### サンプルリクエスト
`GET https://toinfes-api-dev.com/api/user-all`

### 返却値
```json
[
    {
    "userId": "testuser0" , 
    "userName": "てすとゆーざーねーむ",
    "level": 0,
    "class": 0
    },
    {
    "userId": "testuser1" , 
    "userName": "田中太郎",
    "level": 10,
    "class": 20
    }
    ...
]
```

### 詳細

`/user/:userId`と同様です。
ランキングに関しては別に実装予定なので、ここから取得したデータを使わないでください。