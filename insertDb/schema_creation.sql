-- Schema creation for CTF database

-- \connect "ctfDatabase";

CREATE TABLE team(
    team_id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    team_name varchar(255) NOT NULL UNIQUE,
    totalScore int
);

CREATE TABLE ctf_user(
    ctf_user_id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    userName varchar(255) NOT NULL UNIQUE,
    team_id int REFERENCES team(team_id)
);

CREATE TABLE onlineTerminal(
    onlineTerminal_id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    onlineTerminal_link varchar(255),
    ctf_user_id int REFERENCES ctf_user(ctf_user_id),
    container_id int
);

CREATE TABLE level(
    level_id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    level_name varchar(255) NOT NULL,
    level_completion_points int
);

CREATE TABLE levelProgression(
    levelProgression_id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ctf_user_id int REFERENCES ctf_user(ctf_user_id),
    level_id int REFERENCES level(level_id),
    durationsInSeconds int,
    isFinished boolean DEFAULT false
);

CREATE TABLE levelFlag(
    levelFlag_id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    encrypted_value varchar(255) NOT NULL,
    level_id int REFERENCES level(level_id)
);

CREATE TABLE userLevelFlag(
    userLevelFlag_id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ctf_user_id int REFERENCES ctf_user(ctf_user_id),
    levelFlag_id int REFERENCES levelFlag(levelFlag_id)
);




