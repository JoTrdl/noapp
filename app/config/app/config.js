
var path = require('path'),
    i18n = require('i18n');

/*
   System config:

  config/
    app/
      config.json
      config.js
    development/
      config.json
      config.js
    production /
      config.json
      config.js

  1 - Source config.json & merge ENV/config.json
  2 - Require system/config.js
  3 - Requrie ENV/config.js
 */

var config = require('./config.json');

// merge base config with environment config
var envConfig = require(path.resolve(ROOT, 'app', 'config/' + process.env.NODE_ENV, 'config.json'));
config = Object.merge(config, envConfig, true);

// properties to be resolved
var resolveProps = 'models,views,controllers,routes,locales,static,logs'.split(',');
resolveProps.forEach(function(prop){
  app.set(prop, path.resolve(ROOT, config[prop]));
});

// static properties, everything else
Object.keys(config, function(prop, value) {
  if (resolveProps.indexOf(prop) >= 0) return;
  app.set(prop, value);
});

// configure logger
log = require(path.resolve(ROOT, 'app', 'utils', 'logger'))({
  directory: app.settings.logs,
  console: (app.settings.environment == 'development')
});

log.info('Configuring system middleware');
app.use( require('body-parser').urlencoded({ extended: true }) );
app.use( require('body-parser').json() );
app.use( require('cookie-parser')() );
app.use( require('method-override')() );
app.use( require('express-session')(app.settings['express-session']) );
app.use( require('csurf')() );

/* --------------------------
 * Localization
 * --------------------------------------- */
i18n.configure(Object.merge({directory: app.settings.locales}, app.settings.i18n || {}, true ));
app.use(i18n.init);

/* --------------------------
 * Dynamic locals
 * --------------------------------------- */
app.use(function(req, res, next) {
  res.locals.path = req.path;
  res.locals.url = req.url;
  res.locals.user = req.user;
  res.locals.csrftoken = req.csrfToken();

  app.locals.xhrPartial = (req.get('X-Requested-With') == 'XMLHttpRequest');
  next();
});

/* --------------------------
 * Static locals
 * --------------------------------------- */
app.locals = {
  title: app.settings.title,
  version: app.settings.version,
  environment: app.settings.environment,

  moment: require('moment')
};

if (config.socket) {
  log.info('Configuring socket.io server');
  require('./socket.js');
}

