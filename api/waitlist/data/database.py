import datetime
from typing import Dict, Any, Optional
import sqlalchemy
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    BigInteger,
    String,
    Boolean,
    ForeignKey,
    UniqueConstraint,
    SmallInteger,
    DateTime,
    Text,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from .config import CONFIG


def make_engine(cfg: Dict[str, str]) -> sqlalchemy.engine.Engine:
    kwargs: Dict[str, Any] = {}

    for arg_name in ["pool_size", "max_overflow"]:  # Ints
        if arg_name in cfg:
            kwargs[arg_name] = int(cfg[arg_name])
    for arg_name in ["pool_timeout"]:  # Floats
        if arg_name in cfg:
            kwargs[arg_name] = float(cfg[arg_name])
    for arg_name in ["isolation_level"]:  # Strs
        if arg_name in cfg:
            kwargs[arg_name] = str(cfg[arg_name])

    return create_engine(cfg["connect"], future=True, **kwargs)  # type: ignore


engine = make_engine(dict(CONFIG["database"]))
Session = sessionmaker(bind=engine, future=True)

Base = declarative_base()

# pylint: disable=too-few-public-methods,bad-string-format-type


class Character(Base):
    __tablename__ = "character"
    id: int = Column(BigInteger, nullable=False, primary_key=True)
    name: str = Column(String(255), nullable=False)


class AltCharacter(Base):
    __tablename__ = "alt_character"
    account_id: int = Column(
        BigInteger, ForeignKey("character.id"), nullable=False, primary_key=True
    )
    alt_id: int = Column(
        BigInteger, ForeignKey("character.id"), nullable=False, primary_key=True
    )

    account = relationship(Character, foreign_keys=[account_id], uselist=False)
    alt = relationship(Character, foreign_keys=[alt_id], uselist=False)


class Administrator(Base):
    __tablename__ = "admins"
    character_id: int = Column(
        BigInteger, ForeignKey("character.id"), nullable=False, primary_key=True
    )
    level: str = Column(String(64), nullable=False)

    character = relationship(Character, uselist=False)


class RefreshToken(Base):
    __tablename__ = "refresh_token"
    character_id: int = Column(
        BigInteger, ForeignKey("character.id"), nullable=False, primary_key=True
    )
    refresh_token: str = Column(String(255), nullable=False)

    character = relationship(Character, uselist=False)

    def __repr__(self) -> str:
        return "<RefreshToken character_id=%d>" % self.character_id


class AccessToken(Base):
    __tablename__ = "access_token"
    character_id: int = Column(
        BigInteger, ForeignKey("character.id"), nullable=False, primary_key=True
    )
    access_token: str = Column(String(255), nullable=False)
    expires: int = Column(Integer, nullable=False)

    character = relationship(Character, uselist=False)

    def __repr__(self) -> str:
        return "<AccessToken character_id=%d expires=%d>" % (
            self.character_id,
            self.expires,
        )


class Fitting(Base):
    __tablename__ = "fitting"
    id: int = Column(Integer, nullable=False, primary_key=True)
    dna: str = Column(String(1024), nullable=False, unique=True)
    hull: int = Column(Integer, nullable=False)


class ImplantSet(Base):
    __tablename__ = "implant_set"
    id: int = Column(Integer, nullable=False, primary_key=True)
    implants: str = Column(String(256), nullable=False, unique=True)


class Waitlist(Base):
    __tablename__ = "waitlist"
    id: int = Column(Integer, primary_key=True)
    name: str = Column(String(255), nullable=False)
    is_open: bool = Column(Boolean, nullable=False)
    is_archived: bool = Column(Boolean, nullable=False)


class WaitlistEntry(Base):
    __tablename__ = "waitlist_entry"
    __table_args__ = (UniqueConstraint("waitlist_id", "account_id"),)
    id = Column(Integer, primary_key=True)
    waitlist_id: int = Column(Integer, ForeignKey("waitlist.id"), nullable=False)
    account_id: int = Column(BigInteger, ForeignKey("character.id"), nullable=False)
    joined_at: datetime.datetime = Column(
        DateTime, default=datetime.datetime.utcnow, nullable=False
    )

    waitlist = relationship(Waitlist, uselist=False)
    account = relationship(Character, uselist=False)


class WaitlistEntryFit(Base):
    __tablename__ = "waitlist_entry_fit"
    id = Column(Integer, primary_key=True)
    character_id: int = Column(BigInteger, ForeignKey("character.id"), nullable=False)
    entry_id: int = Column(Integer, ForeignKey("waitlist_entry.id"), nullable=False)
    fit_id: int = Column(Integer, ForeignKey("fitting.id"), nullable=False)
    implant_set_id: int = Column(Integer, ForeignKey("implant_set.id"), nullable=False)
    approved: bool = Column(Boolean, nullable=False)
    review_comment: Optional[str] = Column(Text, nullable=True)
    tags: str = Column(String(255), nullable=False)
    category: str = Column(String(10), nullable=False)
    fit_analysis: Optional[str] = Column(Text, nullable=True)
    cached_time_in_fleet: int = Column(Integer, nullable=False)

    character = relationship(Character, uselist=False)
    entry = relationship(WaitlistEntry, uselist=False)
    fit = relationship(Fitting, uselist=False)
    implant_set = relationship(ImplantSet, uselist=False)


class FitHistory(Base):
    __tablename__ = "fit_history"
    id = Column(Integer, primary_key=True)
    character_id: int = Column(BigInteger, ForeignKey("character.id"), nullable=False)
    fit_id: int = Column(Integer, ForeignKey("fitting.id"), nullable=False)
    implant_set_id: int = Column(Integer, ForeignKey("implant_set.id"), nullable=False)
    logged_at: datetime.datetime = Column(
        DateTime, default=datetime.datetime.utcnow, nullable=False
    )

    character = relationship(Character, uselist=False)
    fit = relationship(Fitting, uselist=False)
    implant_set = relationship(ImplantSet, uselist=False)


class Fleet(Base):
    __tablename__ = "fleet"
    id: int = Column(BigInteger, nullable=False, primary_key=True)
    boss_id: int = Column(BigInteger, ForeignKey("character.id"), nullable=False)
    is_updating = Column(Boolean)

    boss = relationship(Character, uselist=False)


class FleetSquad(Base):
    __tablename__ = "fleet_squad"
    fleet_id: int = Column(
        BigInteger, ForeignKey("fleet.id"), nullable=False, primary_key=True
    )
    category: str = Column(String(10), nullable=False, primary_key=True)
    wing_id: int = Column(BigInteger, nullable=False)
    squad_id: int = Column(BigInteger, nullable=False)

    fleet = relationship(Fleet, uselist=False)


class SkillCurrent(Base):
    __tablename__ = "skill_current"
    character_id: int = Column(
        BigInteger, ForeignKey("character.id"), nullable=False, primary_key=True
    )
    skill_id: int = Column(Integer, nullable=False, primary_key=True)
    level: int = Column(SmallInteger, nullable=False)

    character = relationship(Character, uselist=False)


class SkillHistory(Base):
    __tablename__ = "skill_history"
    id = Column(Integer, nullable=False, primary_key=True)
    character_id: int = Column(BigInteger, ForeignKey("character.id"), nullable=False)
    skill_id: int = Column(Integer, nullable=False)
    old_level: int = Column(SmallInteger, nullable=False)
    new_level: int = Column(SmallInteger, nullable=False)
    logged_at: datetime.datetime = Column(
        DateTime, default=datetime.datetime.utcnow, nullable=False
    )

    character = relationship(Character, uselist=False)


class Ban(Base):
    __tablename__ = "ban"
    kind: str = Column(String(10), nullable=False, primary_key=True)
    id: int = Column(BigInteger, nullable=False, primary_key=True)
    expires_at: Optional[datetime.datetime] = Column(DateTime)


class FleetActivity(Base):
    __tablename__ = "fleet_activity"
    id: int = Column(Integer, nullable=False, primary_key=True)
    character_id: int = Column(BigInteger, ForeignKey("character.id"), nullable=False)
    fleet_id: int = Column(BigInteger, nullable=False, index=True)

    first_seen: int = Column(Integer, nullable=False)
    last_seen: int = Column(Integer, nullable=False)
    hull: int = Column(Integer, nullable=False)
    has_left: bool = Column(Boolean, default=False, nullable=False)
    is_boss: bool = Column(Boolean, default=False, nullable=False)

    character = relationship(Character, uselist=False)


Base.metadata.create_all(engine)
