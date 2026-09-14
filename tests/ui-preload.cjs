const { contextBridge }=require('electron');
const delay=value=>new Promise(resolve=>setTimeout(()=>resolve(value),80));
contextBridge.exposeInMainWorld('advisor',{
  getStatus:async()=>({configured:true,source:'test',model:'mock',gemini:{configured:true,source:'test'}}),
  ask:p=>delay(p.task==='literary_imitation_review'?{assessment:'测试评估：保留声音',suggestions:['风从哪里来？'],revision:'测试参考稿'}:'测试审美回答'),
  cancel:async()=>({ok:true}),setApiKey:async()=>({ok:true}),clearApiKey:async()=>({ok:true}),setGeminiApiKey:async()=>({ok:true}),clearGeminiApiKey:async()=>({ok:true})
});
let configured=false;
contextBridge.exposeInMainWorld('app',{getSplash:async()=>null,getSplashInfo:async()=>({configured,directory:'测试临时数据目录'}),chooseSplash:async()=>{configured=true;return {configured};},resetSplash:async()=>{configured=false;return {configured};}});
// No real keys or model calls. Disk backup IPC is tested separately.
