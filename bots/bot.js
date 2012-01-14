var Hook  = require('hook.io').Hook;
var KadOH = require(__dirname + '/../dist/KadOH.node.js');
var util  = require('util');

//
// Bot
//

var Bot = exports.Bot = function(options) {
  options = options || {
    node : {},
    hook : {
      name : 'bot'
    },
    delay : undefined
  };
  Hook.call(this, options.hook);
  this.kadoh = new KadOH.Node(null, options.node);
  var self = this;
  self.on('hook::ready', function() {
    try {
      self.emit('initialized', options);
      if (options.delay) {
        setTimeout(function() {
          self.k_connect();
          self.k_join();
        }, options.delay);
      }
    } catch(e) {
      self.emit('error::initialize', e);
    }
  });
};
util.inherits(Bot, Hook);

Bot.prototype.k_connect = function() {
  this.kadoh.connect(function() {
    this.emit('connected');
  }, this);
};

Bot.prototype.k_join = function() {
  this.kadoh.join(['foo@bar.org'], function() {
    this.emit('joined');
  }, this);
};

//
// CLI
// 

if (process.argv.length > 2) {
  var argv  = require('optimist')
              .usage('Usage: $0 --protocol xmlrpc --transport UDP -j foo@bar -r kadoh -p azerty -d 1000')
              .alias('j', 'jid')
              .alias('r', 'resource')
              .alias('p', 'password')
              .alias('d', 'delay')
              .argv;

  var debug     = !!argv.debug,
      name      = argv.udp ? 'udpbot'   : 'xmppbot'
      protocol  = argv.udp ? 'jsonrpc2' : 'node_xmlrpc',
      type      = argv.udp ? 'UDP'      : 'NodeXMPP',
      delay     = argv.delay || 0,
      transport = {
        jid      : argv.jid,
        resource : argv.resource,
        password : argv.password,
        port     : argv.port
      };
  var config = {
    hook : {
      name: name
    },
    node : {
      reactor : {
        protocol  : protocol,
        type      : type,
        transport : transport
      }
    },
    delay : delay
  };

  var bot = new Bot(config);
  bot.start();

  if (debug) {
    bot.on('hook::ready', function() {
      KadOH.log.setLevel('debug');
      KadOH.log.subscribeTo(bot.kadoh);
      KadOH.log.subscribeTo(bot.kadoh._reactor);
      KadOH.log.subscribeTo(bot.kadoh._reactor._transport);
    });
  }
}