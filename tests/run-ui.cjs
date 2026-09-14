const {spawn}=require('child_process'),path=require('path');
const executable=process.env.ELECTRON_TEST_BINARY||require('electron');
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;delete env.K3_API_KEY;delete env.GEMINI_API_KEY;
const child=spawn(executable,[path.join(__dirname,process.argv.includes('--main')?'main-smoke.cjs':'ui-smoke.cjs')],{env,windowsHide:true,stdio:'inherit'});
child.on('error',e=>{console.error(e.message);process.exitCode=1;});child.on('exit',code=>process.exitCode=code??1);
