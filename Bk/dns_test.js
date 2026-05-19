const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.resolveSrv('_mongodb._tcp.cluster0.kh39zlj.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('Error resolving SRV:', err);
  } else {
    console.log('SRV Records:', addresses);
  }
});
