from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from os import getenv
from models.base_model import Base
from models.user import User
from models.treatment import Treatment
from models.comment import Comment
from models.message import Message
from models.chat import Chat
from models.post import Post
from models.review import Review
from models.rating import Rating
from models.violation import Violation
from models.reply import Reply
from models.waitlist import WaitListUser

classes = {
    "User": User,
    "Treatment": Treatment,
    "Comment": Comment,
    "Message": Message,
    "Chat": Chat,
    "Post": Post,
    "Review": Review,
    "Rating": Rating,
    "Violation": Violation,
    "Reply": Reply,
    "WaitListUser": WaitListUser
}


class DBStorage:
    """interaacts with the MySQL database"""
    __engine = None
    __session = None

    def __init__(self):
        """Instantiate a DBStorage object"""
        AHC_USER = getenv("AHC_USER")
        AHC_PASSWORD = getenv("AHC_PASSWORD")
        AHC_DATABASE = getenv("AHC_DATABASE")
        AHC_HOST = getenv("AHC_HOST")
        AHC_ENV = getenv("AHC_ENV")
        DATABASE_URL = getenv("DATABASE_URL")
        self.__engine = create_engine(DATABASE_URL)
        if AHC_ENV == "test":
            Base.metadata.drop_all(self.__engine)
        self.reload()

    def all(self, cls=None):
        """query on the current database session"""
        new_dict = {}
        for clss in classes:
            if cls is None or cls is classes[clss] or cls is clss:
                objs = self.__session.query(classes[clss]).all()
                for obj in objs:
                    key = obj.__class__.__name__ + '.' + obj.id
                    new_dict[key] = obj
        return (new_dict)

    def new(self, obj):
        """Add the object to the current database session."""
        try:
            self.__session.add(obj)
            self.__session.commit()
        except Exception as e:
            self.__session.rollback()
            raise e


    def save(self):
        """commit all changes of the current database session"""
        self.__session.commit()

    def delete(self, obj=None):
        """delete from the current database session obj if not None"""
        if obj is not None:
            self.__session.delete(obj)

    def reload(self):
        """reloads data from the database"""
        Base.metadata.create_all(self.__engine)
        sess_factory = sessionmaker(bind=self.__engine, expire_on_commit=False)
        Session = scoped_session(sess_factory)
        self.__session = Session

    def close(self):
        """call remove() method on the private session attribute"""
        self.__session.remove()

    def rollback(self):
        self.__session.rollback()

    def get(self, cls, id):
        """
        Returns the object based on the class name and its ID, or
        None if not found
        """
        if cls not in classes.values():
            return None

        all_cls = self.all(cls)
        for value in all_cls.values():
            if (value.id == id):
                return value

        return None
    def get_by_email(self, email, cls=User):
        """Retrieve a record by email."""
        return self.__session.query(cls).filter(cls.email == email).first()

    def count(self, cls=None):
        """
        count the number of objects in storage
        """
        all_class = classes.values()

        if not cls:
            count = 0
            for clas in all_class:
                count += len(models.storage.all(clas).values())
        else:
            count = len(models.storage.all(cls).values())

        return count
_db = DBStorage()

def get_db():
    try:
        yield _db
    finally:
        _db.close()
