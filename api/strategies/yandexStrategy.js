const { Strategy: YandexStrategy } = require('passport-yandex');
const socialLogin = require('./socialLogin');

const getProfileDetails = ({ profile }) => ({
  email: profile.emails[0].value,
  id: profile.id,
  avatarUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
  username: profile.displayName || profile.username,
  name: profile.displayName || profile.username,
  emailVerified: profile.emails[0].verified || false,
});

const yandexLogin = socialLogin('yandex', getProfileDetails);

module.exports = () =>
  new YandexStrategy(
    {
      clientID: process.env.YANDEX_CLIENT_ID,
      clientSecret: process.env.YANDEX_CLIENT_SECRET,
      callbackURL: `${process.env.DOMAIN_SERVER}${process.env.YANDEX_CALLBACK_URL}`,
      proxy: true,
    },
    yandexLogin,
  ); 