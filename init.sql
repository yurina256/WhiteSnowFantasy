CREATE DATABASE toinfes;
USE toinfes;
CREATE TABLE users (
    userId VARCHAR(40) not null primary key,
    userName VARCHAR(64) not null,
    level INT not null,
    class INT not null
);

CREATE TABLE events (
    eventId INT NOT NULL,
    type INT NOT NULL,
    message TEXT,
    level INT,
    permise_1 INT, -- 前提条件
    image VARCHAR(64), -- 画像ファイル名
    foreign key (permise_1) REFERENCES events(eventId),
    PRIMARY KEY (eventId)
);

CREATE TABLE log (
    logId INT NOT NULL AUTO_INCREMENT,
    userId VARCHAR(40) not null,
    eventId INT not null,
    time DATETIME,
    foreign key (userId) REFERENCES users(userId),
    foreign key (eventId) REFERENCES events(eventId),
    PRIMARY KEY (logID)
);


-- testCase
insert into users value("testuser0","てすとゆーざーねーむ",0,0);
insert into users value("testuser1","田中太郎",10,20);
insert into users value("testuser2","東雲ゆりな",15,20);