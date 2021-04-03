import datetime
from typing import Dict, Any
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

    return create_engine(cfg["connect"], **kwargs)


engine = make_engine(dict(CONFIG["database"]))
Session = sessionmaker(bind=engine)

Base = declarative_base()

# pylint: disable=too-few-public-methods,bad-string-format-type


class Character(Base):
    __tablename__ = "character"
    id = Column(BigInteger, nullable=False, primary_key=True)
    name = Column(String(255), nullable=False)


class AltCharacter(Base):
    __tablename__ = "alt_character"
    account_id = Column(
        BigInteger, ForeignKey("character.id"), nullable=False, primary_key=True
    )
    alt_id = Column(
        BigInteger, ForeignKey("character.id"), nullable=False, primary_key=True
    )

    account = relationship("Character", foreign_keys=[account_id])
    alt = relationship("Character", foreign_keys=[alt_id])


class Administrator(Base):
    __tablename__ = "admins"
    character_id = Column(
        BigInteger, ForeignKey("character.id"), nullable=False, primary_key=True
    )
    level = Column(String(64), nullable=False)

    character = relationship("Character")


class RefreshToken(Base):
    __tablename__ = "refresh_token"
    character_id = Column(
        BigInteger, ForeignKey("character.id"), nullable=False, primary_key=True
    )
    refresh_token = Column(String(255), nullable=False)

    character = relationship("Character")

    def __repr__(self) -> str:
        return "<RefreshToken character_id=%d>" % self.character_id


class AccessToken(Base):
    __tablename__ = "access_token"
    character_id = Column(
        BigInteger, ForeignKey("character.id"), nullable=False, primary_key=True
    )
    access_token = Column(String(255), nullable=False)
    expires = Column(Integer, nullable=False)

    character = relationship("Character")

    def __repr__(self) -> str:
        return "<AccessToken character_id=%d expires=%d>" % (
            self.character_id,
            self.expires,
        )


class Fitting(Base):
    __tablename__ = "fitting"
    id = Column(Integer, nullable=False, primary_key=True)
    dna = Column(String(1024), nullable=False, unique=True)
    hull = Column(Integer, nullable=False)


class ImplantSet(Base):
    __tablename__ = "implant_set"
    id = Column(Integer, nullable=False, primary_key=True)
    implants = Column(String(256), nullable=False, unique=True)


class Waitlist(Base):
    __tablename__ = "waitlist"
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    is_open = Column(Boolean, nullable=False)
    is_archived = Column(Boolean, nullable=False)


class WaitlistEntry(Base):
    __tablename__ = "waitlist_entry"
    __table_args__ = (UniqueConstraint("waitlist_id", "account_id"),)
    id = Column(Integer, primary_key=True)
    waitlist_id = Column(Integer, ForeignKey("waitlist.id"), nullable=False)
    account_id = Column(BigInteger, ForeignKey("character.id"), nullable=False)
    joined_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    waitlist = relationship("Waitlist")
    account = relationship("Character")


class WaitlistEntryFit(Base):
    __tablename__ = "waitlist_entry_fit"
    id = Column(Integer, primary_key=True)
    character_id = Column(BigInteger, ForeignKey("character.id"), nullable=False)
    entry_id = Column(Integer, ForeignKey("waitlist_entry.id"), nullable=False)
    fit_id = Column(Integer, ForeignKey("fitting.id"), nullable=False)
    implant_set_id = Column(Integer, ForeignKey("implant_set.id"), nullable=False)
    approved = Column(Boolean, nullable=False)
    reject_reason = Column(Text, nullable=True)
    tags = Column(String(255), nullable=False)
    category = Column(String(10), nullable=False)
    fit_analysis = Column(Text, nullable=True)
    cached_time_in_fleet = Column(Integer, nullable=False)

    character = relationship("Character")
    entry = relationship("WaitlistEntry")
    fit = relationship("Fitting")
    implant_set = relationship("ImplantSet")


class FitHistory(Base):
    __tablename__ = "fit_history"
    id = Column(Integer, primary_key=True)
    character_id = Column(BigInteger, ForeignKey("character.id"), nullable=False)
    fit_id = Column(Integer, ForeignKey("fitting.id"), nullable=False)
    implant_set_id = Column(Integer, ForeignKey("implant_set.id"), nullable=False)
    logged_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    character = relationship("Character")
    fit = relationship("Fitting")
    implant_set = relationship("ImplantSet")


class Fleet(Base):
    __tablename__ = "fleet"
    id = Column(BigInteger, nullable=False, primary_key=True)
    boss_id = Column(BigInteger, ForeignKey("character.id"), nullable=False)
    is_updating = Column(Boolean)

    boss = relationship("Character")


class FleetSquad(Base):
    __tablename__ = "fleet_squad"
    fleet_id = Column(
        BigInteger, ForeignKey("fleet.id"), nullable=False, primary_key=True
    )
    category = Column(String(10), nullable=False, primary_key=True)
    wing_id = Column(BigInteger, nullable=False)
    squad_id = Column(BigInteger, nullable=False)

    fleet = relationship("Fleet")


class SkillCurrent(Base):
    __tablename__ = "skill_current"
    character_id = Column(
        BigInteger, ForeignKey("character.id"), nullable=False, primary_key=True
    )
    skill_id = Column(Integer, nullable=False, primary_key=True)
    level = Column(SmallInteger, nullable=False)

    character = relationship("Character")


class SkillHistory(Base):
    __tablename__ = "skill_history"
    id = Column(Integer, nullable=False, primary_key=True)
    character_id = Column(BigInteger, ForeignKey("character.id"), nullable=False)
    skill_id = Column(Integer, nullable=False)
    old_level = Column(SmallInteger, nullable=False)
    new_level = Column(SmallInteger, nullable=False)
    logged_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    character = relationship("Character")


class Ban(Base):
    __tablename__ = "ban"
    kind = Column(String(10), nullable=False, primary_key=True)
    id = Column(BigInteger, nullable=False, primary_key=True)
    expires_at = Column(DateTime)


class FleetActivity(Base):
    __tablename__ = "fleet_activity"
    id = Column(Integer, nullable=False, primary_key=True)
    character_id = Column(BigInteger, ForeignKey("character.id"), nullable=False)
    fleet_id = Column(BigInteger, nullable=False, index=True)

    first_seen = Column(Integer, nullable=False)
    last_seen = Column(Integer, nullable=False)
    hull = Column(Integer, nullable=False)
    has_left = Column(Boolean, default=False, nullable=False)

    character = relationship("Character")


Base.metadata.create_all(engine)
