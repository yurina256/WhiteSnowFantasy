CREATE DATABASE toinfes;
USE toinfes;

CREATE TABLE class (
    id INT NOT NULL primary key,
    level INT
);

CREATE TABLE users (
    userId VARCHAR(40) not null primary key,
    userName VARCHAR(64) not null,
    level INT not null,
    class INT not null,
    route_a_next INT, -- 次のイベントID(完了時は0)
    route_b_next INT,
    route_c_next INT
);

CREATE TABLE events (
    eventId INT NOT NULL,
    type INT NOT NULL, -- 0 謎解き 1宝探し　2その他
    message TEXT,
    level INT,
    permise_1 INT, -- 前提条件
    permise_2 INT,
    permise_3 INT,
    keyword VARCHAR(64), -- 召喚キーワード
    keyword2 VARCHAR(64), -- 召喚キーワード(表記ゆれ)
    image VARCHAR(64), -- 画像ファイル名
    link VARCHAR(128), -- 遷移先リンク
    foreign key (permise_1) REFERENCES events(eventId),
    foreign key (permise_2) REFERENCES events(eventId),
    foreign key (permise_3) REFERENCES events(eventId),
    PRIMARY KEY (eventId)
);

CREATE TABLE log ( -- events内の実行を記録　登録などは扱わない　フラグ管理など
    logId INT NOT NULL AUTO_INCREMENT,
    userId VARCHAR(40) not null,
    eventId INT not null,
    type INT, -- 0 謎解き 1宝探し 2その他 3ヒント提供
    time DATETIME,
    foreign key (userId) REFERENCES users(userId),
    foreign key (eventId) REFERENCES events(eventId),
    PRIMARY KEY (logID)
);


-- testCase
insert into users value("testuser0","てすとゆーざーねーむ",0,0,1,6,10);
insert into users value("testuser1","田中太郎",10,20,1,6,10);
insert into users value("testuser2","東雲ゆりな",15,20,1,6,10);