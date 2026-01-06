const mmWebsocketModule = require('moomoo-api');
const mmWebsocket = mmWebsocketModule.default || mmWebsocketModule;

console.log('🧪 Testing Moomoo OpenD connection...');
console.log('📦 mmWebsocket type:', typeof mmWebsocket);
console.log('📍 Target: 127.0.0.1:33333');
console.log('🔑 Key: pk_5a8f9c2b4e3d1');
console.log('');

if (typeof mmWebsocket !== 'function') {
  console.error('❌ ERROR: mmWebsocket is not a constructor!');
  console.error('   Module exports:', Object.keys(mmWebsocketModule));
  process.exit(1);
}

const websocket = new mmWebsocket();

websocket.onlogin = (ret, msg) => {
  console.log('');
  console.log('📡 Login callback received!');
  console.log('   Return code:', ret);
  console.log('   Message:', msg || '(empty)');
  console.log('');
  
  if (ret === 0) {
    console.log('✅ SUCCESS! Connection works!');
    console.log('   OpenD is responding correctly.');
    websocket.stop();
    process.exit(0);
  } else {
    console.error('❌ FAILED! Login error');
    console.error('   Code:', ret);
    console.error('   Message:', msg);
    console.error('');
    console.error('Possible issues:');
    console.error('1. Wrong WebSocket Auth Key');
    console.error('2. Account not authorized');
    console.error('3. OpenD settings mismatch');
    process.exit(1);
  }
};

console.log('🔌 Attempting connection...');

try {
  websocket.start(
    '127.0.0.1',
    33333,
    false,
    'pk_5a8f9c2b4e3d1'
  );
  
  console.log('⏳ Waiting for response (timeout in 20 seconds)...');
  console.log('');
  
  setTimeout(() => {
    console.error('');
    console.error('⏰ TIMEOUT - No response after 20 seconds');
    console.error('');
    console.error('The port is listening but not responding.');
    console.error('This usually means:');
    console.error('1. Wrong WebSocket Auth Key');
    console.error('2. OpenD is running but not fully initialized');
    console.error('3. Protocol version mismatch');
    console.error('');
    console.error('Please verify in Moomoo OpenD:');
    console.error('- WebSocket Auth Key = pk_5a8f9c2b4e3d1');
    console.error('- Status shows "Connected" (not just running)');
    process.exit(1);
  }, 20000);
  
} catch (error) {
  console.error('');
  console.error('💥 Exception during connection:');
  console.error(error);
  process.exit(1);
}
