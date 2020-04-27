const fetch = require('node-fetch');

const authKeyId = "keyId-AdXLTiHOWkwFaRYyzetnhZZOHdAbzHnq";
const authKey = "secret-nFqXnhmVr7WevOB82jgbq9qz80aPp2EtxoOuhXitVTaHxkvp9cU25thfOWxVyody";
const resource = "";

let apiKey = "api-ca6e4792-daca-4153-892b-3eabd9001115";
let token = "eyJraWQiOiJBUUVDQUhnYmdGdnFrclRTbGlNVmNCQnV0VXlVcnNvU1RqTTM4Nl" +
	"R5WGVsaEdlUWtOd0FBQVk0d2dnR0tCZ2txaGtpRzl3MEJCd2FnZ2dGN01JSUJk" +
	"d0lCQURDQ0FYQUdDU3FHU0liM0RRRUhBVEFlQmdsZ2hrZ0JaUU1FQVM0d0VRUU" +
	"1WbHM1V2dFaEMvbWkvcjdCQWdFUWdJSUJRUmdSVDJsV3ZjZWN2dTg0QVFGMTdo" +
	"UHlKK3VWUXFvbEl4MHdXQ1R6djVxWVIraVFRQTNwTStQS3NKcE9rMXpydTNZMG" +
	"5JbVRISHUwZ2docm1aTTNYeDIwbkRpdGRTMm5HMGR3VEplOGFtaEFsczVLVEdo" +
	"Rm1kRXN4bjNCUE51aXZYUkFzNndxdW9WcGVzYUI5TkM1eDJieWk0ZzkzbU90aU" +
	"hjWWVpUVdSU2NQRG5aQkxndzFPbTNic01Mc1BBci9rSWszcWo2Ui9mVDd6bXVK" +
	"eHdnQ1hoTzhhWVBubzhsMS9FblBvQXBycFRwODJzbHBMakxFUXpBeDFIamVHOE" +
	"FYeUJ0Y1JuL010d3RwK0xIc2RjT0tHaHFCdGNlT2xyVXVJK2kwYllzUVpVRWc5" +
	"ZkNMSjhVUHpCUHNXQmFvQnNwMFZBTTZxWlhIUFpObG9HUmsvT3c1YUJNSVRWUF" +
	"B4NkQ1eGcyUDRUM2dRLzF4VUtoM1Y0RjJkN3JwRUVpaFJyckNNdFdPN21hNXVx" +
	"WEdUT2tZbGowRUNsU2Z6Y3Uwd3BBcWpUdzE0TTl1NHNyOU5BPT0iLCJhbGciOi" +
	"JSUzI1NiJ9.eyJpc3MiOiJzb3JhY29tLmlvIiwiYXVkIjoiT3BlcmF0b3IiLCJ" +
	"leHAiOjE1ODgwNDA1NDMsImp0aSI6IlZJNDNaSFhTUms1TllFX3pmQ3dhV3ciL" +
	"CJpYXQiOjE1ODc5NTQxNDMsIm5iZiI6MTU4Nzk1NDAyMywic3ViIjoic29yYWN" +
	"vbSIsIm9wZXJhdG9yIjp7ImNvdmVyYWdlVHlwZXMiOlsianAiLCJnIl0sInBlc" +
	"m1pc3Npb25zIjpbeyJzdGF0ZW1lbnRzIjpbeyJlZmZlY3QiOiJhbGxvdyIsImF" +
	"waSI6WyIqIl19XX1dLCJhY2NvdW50VHlwZSI6IjAiLCJ1c2VyTmFtZSI6IlRhb" +
	"CIsInBheW1lbnRNZXRob2RTdGF0dXMiOiJyZWdpc3RlcmVkIiwib3BlcmF0b3J" +
	"JZCI6Ik9QMDAyNDM1OTEyNCIsImNvdmVyYWdlVHlwZUF0dHJpYnV0ZXMiOnsia" +
	"nAiOnsidGVybXNWZXJzaW9uIjoiMSIsInBheW1lbnRNZXRob2RTdGF0dXMiOiJ" +
	"yZWdpc3RlcmVkIiwiY29udHJhY3RzIjpbImxhZ29vbiJdLCJjb250cmFjdERld" +
	"GFpbCI6eyJsYWdvb24iOnsicGxhbiI6ImZyZWUiLCJsaWNlbnNlUGFjayI6e31" +
	"9fX0sImciOnsidGVybXNWZXJzaW9uIjoiMSIsInBheW1lbnRNZXRob2RTdGF0d" +
	"XMiOiJ1bnJlZ2lzdGVyZWQiLCJjb250cmFjdHMiOltdLCJjb250cmFjdERldGF" +
	"pbCI6e319fX19.Wb04A-h5rkrFpRdXrnwiH-BIqlprj03LFgm878pwj48bEVzH" +
	"qNJFXIT5jCzRbNNCIbLQf1iEOG3bIThhGHB9_ViTbbZOuCh7RNtA-30dT6gYqm" +
	"BQGzSCOTnJoQyd2XPsPDzI46G8Fn7I9ewUSpLK7A5zRXcg45vOtIf_RIylKQzO" +
	"j6tIU9TOcGyUCEJgV3-1XF7Jd2_Epa9YVrx6eihl8akHjM7XIbG9idLkYJEtRz" +
	"Vc4ei9skp3rkDzzyBLTCCTkJ4Gu_8r14LCG_ZLe-Pl0AIw3mR7cqJm1xWrNCoM" +
	"v_8vNtp-r43M7536S_gwhGKHek5di7NH64Pf7UHTBN3wpA";

// get API key
(async () => {
	const api = await fetch('https://api.soracom.io/v1/auth', {
		method: 'POST',
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ authKeyId, authKey })
	})
		.then(res => res.json())
		.then(apikey => ({
			...apikey,
			message: "Success to get api key",
		}))
		.catch(_ => ({
			error: _,
			message: "Failed to fetch apikey",
		}));

	apiKey = api.apiKey;
	token = api.token;
});

// get subscriber
(async () => {
	console.log(await fetch('https://api.soracom.io/v1/subscribers', {
		method: 'GET',
		headers: {
			'X-Soracom-API-Key': apiKey,
			'X-Soracom-Token': token
		}
	})
		.then(res => res.json())
		.catch(_ => ({
			error: _,
			message: "Failed to fetch apikey",
		})));
})();

