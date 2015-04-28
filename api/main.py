from google.appengine.ext import ndb
from protorpc import messages
from protorpc import message_types
from protorpc import remote
import endpoints

localhost = '737232045163-22rv82eod96bv46vphb63'\
            'pde23cm5t8m.apps.googleusercontent.com'
localhost8080 = '737232045163-5dmfng17mjmg32p01p35'\
                'restig325orb.apps.googleusercontent.com'

api = endpoints.api(name='gdgkobe20150429', version='v1',
                    allowed_client_ids=[localhost, localhost8080],
                    scopes=[endpoints.EMAIL_SCOPE])


class Article(ndb.Model):
    title = ndb.StringProperty(required=True)
    text = ndb.TextProperty(required=True)
    user = ndb.UserProperty(required=True)
    created = ndb.DateTimeProperty(auto_now_add=True)


class ArticleResponseMessage(messages.Message):
    key = messages.IntegerField(1)
    title = messages.StringField(2)
    text = messages.StringField(3)
    user = messages.StringField(4)
    created = messages.StringField(5)


class ArticleRequestMessage(messages.Message):
    title = messages.StringField(1)
    text = messages.StringField(2)


class ArticleCollectionMessage(messages.Message):
    items = messages.MessageField(ArticleResponseMessage, 1, repeated=True)


@api.api_class(resource_name='articles')
class Articles(remote.Service):
    QueryResource = endpoints.ResourceContainer(
        message_types.VoidMessage)

    @endpoints.method(ArticleRequestMessage, ArticleResponseMessage,
                      path='articles', http_method='POST',
                      name='post')
    def post(self, request):
        current_user = get_current_user()
        article = Article()
        article.title = request.title
        article.text = request.text
        article.user = current_user
        article.put()
        message = article_to_message(article)
        return message

    @endpoints.method(QueryResource, ArticleCollectionMessage,
                      path='articles', http_method='GET',
                      name='query')
    def query(self, request):
        articles = Article.query().order(-Article.created)
        message = ArticleCollectionMessage()
        message.items = [article_to_message(article) for article in articles]
        return message


def article_to_message(article):
    message = ArticleResponseMessage()
    message.key = article.key.id()
    message.title = article.title
    message.text = article.text
    message.user = article.user.nickname()
    message.created = article.created.strftime('%Y-%m-%dT%H:%M:%SZ')
    return message


def get_current_user():
    current_user = endpoints.get_current_user()
    if current_user is None:
        raise endpoints.UnauthorizedException('Invalid token')
    return current_user


def check_owner(article, user):
    if article.user != user:
        raise endpoints.ForbiddenException('Access denied')


application = endpoints.api_server([api])
