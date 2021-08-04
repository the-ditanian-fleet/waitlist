set -ex

[ -f sqlite-shrunk.sqlite ] && rm sqlite-shrunk.sqlite
[ -f sqlite-latest.sqlite.bz2 ] && rm sqlite-latest.sqlite.bz2
[ -f sqlite-latest.sqlite ] && rm sqlite-latest.sqlite

wget https://www.fuzzwork.co.uk/dump/sqlite-latest.sqlite.bz2
bzip2 -d sqlite-latest.sqlite.bz2
sqlite3 sqlite-shrunk.sqlite "
attach 'sqlite-latest.sqlite' as ext;
create table invTypes as select * from ext.invTypes;
create index invTypes_name on invTypes (typeName);
create index invTypes_typeID on invTypes (typeID);

create table invGroups as select * from ext.invGroups;
create index invGroups_groupID on invGroups (groupID);

create table invMetaTypes as select * from ext.invMetaTypes;
create index invMetaTypes_typeID on invMetaTypes (typeID);
create index invMetaTypes_parentTypeID on invMetaTypes (parentTypeID);

create table dgmTypeAttributes as select * from ext.dgmTypeAttributes where attributeID IN (
    633, -- meta level
    984,985,986,987, -- resists
    182,183,184,1285,1289,1290, -- skill req
    277,278,279,1286,1287,1288 -- skil req level
);
create index dgmTypeAttributes_typeID on dgmTypeAttributes (typeID);

create table dgmTypeEffects as select * from ext.dgmTypeEffects where effectID IN (11,12,13,2663);
create index dgmTypeEffects_typeID on dgmTypeEffects (typeID);
"
