CREATE DATABASE toinfes;
USE toinfes;
CREATE TABLE users (
    userId VARCHAR(40) not null primary key,
    userName VARCHAR(60) not null,
    level INT not null,
    class INT not null
);

CREATE TABLE log (
    logId INT NOT NULL AUTO_INCREMENT,
    userId VARCHAR(40) not null,
    eventId INT not null,
    time DATETIME,
    foreign key (userId) REFERENCES users(userId),
    PRIMARY KEY (logID)
);

-- testCase
insert into users value("testuser0","てすとゆーざーねーむ",0,0);
insert into users value("testuser1","田中太郎",10,20);