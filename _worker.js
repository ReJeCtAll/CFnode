
// 部署完成后在网址后面加上这个，获取自建节点和机场聚合节点，/?token=auto或/auto或

let mytoken = 'auto';
let guestToken = ''; //可以随便取，或者uuid生成，https://1024tools.com/uuid
let BotToken = ''; //可以为空，或者@BotFather中输入/start，/newbot，并关注机器人
let ChatID = ''; //可以为空，或者@userinfobot中获取，/start
let TG = 0; //小白勿动， 开发者专用，1 为推送所有的访问信息，0 为不推送订阅转换后端的访问信息与异常访问
let FileName = 'CF-Workers-SUB';
let SUBUpdateTime = 6; //自定义订阅更新时间，单位小时
let total = 99;//TB
let timestamp = 4102329600000;//2099-12-31

//节点链接 + 订阅链接
let MainData = `
https://cfxr.eu.org/getSub
`;

let urls = [];
let subConverter = "https://sub2.waf.im/subapi"; //在线订阅转换后端，目前使用CM的订阅转换功能。支持自建psub 可自行搭建https://github.com/bulianglin/psub
let subConfig = "https://raw.githubusercontent.com/ReJeCtAll/clashrules/main/ACL4SSR_Online_Full_MultiMode.ini"; //订阅配置文件
let subProtocol = 'https';

export default {
	async fetch(request, env) {
		const userAgentHeader = request.headers.get('User-Agent');
		const userAgent = userAgentHeader ? userAgentHeader.toLowerCase() : "null";
		const url = new URL(request.url);
		const token = url.searchParams.get('token');
		mytoken = env.TOKEN || mytoken;
		BotToken = env.TGTOKEN || BotToken;
		ChatID = env.TGID || ChatID;
		TG = env.TG || TG;
		subConverter = env.SUBAPI || subConverter;
		if (subConverter.includes("http://")) {
			subConverter = subConverter.split("//")[1];
			subProtocol = 'http';
		} else {
			subConverter = subConverter.split("//")[1] || subConverter;
		}
		subConfig = env.SUBCONFIG || subConfig;
		FileName = env.SUBNAME || FileName;

		const currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);
		const timeTemp = Math.ceil(currentDate.getTime() / 1000);
		const fakeToken = await MD5MD5(`${mytoken}${timeTemp}`);
		guestToken = env.GUESTTOKEN || env.GUEST || guestToken;
		if (!guestToken) guestToken = await MD5MD5(mytoken);
		const 访客订阅 = guestToken;
		//console.log(`${fakeUserID}\n${fakeHostName}`); // 打印fakeID

		let UD = Math.floor(((timestamp - Date.now()) / timestamp * total * 1099511627776) / 2);
		total = total * 1099511627776;
		let expire = Math.floor(timestamp / 1000);
		SUBUpdateTime = env.SUBUPTIME || SUBUpdateTime;

		if (!([mytoken, fakeToken, 访客订阅].includes(token) || url.pathname == ("/" + mytoken) || url.pathname.includes("/" + mytoken + "?"))) {
			if (TG == 1 && url.pathname !== "/" && url.pathname !== "/favicon.ico") await sendMessage(`#异常访问 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgent}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
			if (env.URL302) return Response.redirect(env.URL302, 302);
			else if (env.URL) return await proxyURL(env.URL, url);
			else return new Response(await nginx(), {
				status: 200,
				headers: {
					'Content-Type': 'text/html; charset=UTF-8',
				},
			});
		} else {
			if (env.KV) {
				await 迁移地址列表(env, 'LINK.txt');
				if (userAgent.includes('mozilla') && !url.search) {
					await sendMessage(`#编辑订阅 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgentHeader}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
					return await KV(request, env, 'LINK.txt', 访客订阅);
				} else {
					MainData = await env.KV.get('LINK.txt') || MainData;
				}
			} else {
				MainData = env.LINK || MainData;
				if (env.LINKSUB) urls = await ADD(env.LINKSUB);
			}
			let 重新汇总所有链接 = await ADD(MainData + '\n' + urls.join('\n'));
			let 自建节点 = "";
			let 订阅链接 = "";
			for (let x of 重新汇总所有链接) {
				if (x.toLowerCase().startsWith('http')) {
					订阅链接 += x + '\n';
				} else {
					自建节点 += x + '\n';
				}
			}
			MainData = 自建节点;
			urls = await ADD(订阅链接);
			await sendMessage(`#获取订阅 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgentHeader}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
			const isSubConverterRequest = request.headers.get('subconverter-request') || request.headers.get('subconverter-version') || userAgent.includes('subconverter');
			let 订阅格式 = 'base64';
			if (!(userAgent.includes('null') || isSubConverterRequest || userAgent.includes('nekobox') || userAgent.includes(('CF-Workers-SUB').toLowerCase()))) {
				if (userAgent.includes('sing-box') || userAgent.includes('singbox') || url.searchParams.has('sb') || url.searchParams.has('singbox')) {
					订阅格式 = 'singbox';
				} else if (userAgent.includes('surge') || url.searchParams.has('surge')) {
					订阅格式 = 'surge';
				} else if (userAgent.includes('quantumult') || url.searchParams.has('quanx')) {
					订阅格式 = 'quanx';
				} else if (userAgent.includes('loon') || url.searchParams.has('loon')) {
					订阅格式 = 'loon';
				} else if (userAgent.includes('clash') || userAgent.includes('meta') || userAgent.includes('mihomo') || url.searchParams.has('clash')) {
					订阅格式 = 'clash';
				}
			}

			let subConverterUrl;
			let 订阅转换URL = `${url.origin}/${await MD5MD5(fakeToken)}?token=${fakeToken}`;
			//console.log(订阅转换URL);
			let req_data = MainData;

			let 追加UA = 'v2rayn';
			if (url.searchParams.has('b64') || url.searchParams.has('base64')) 订阅格式 = 'base64';
			else if (url.searchParams.has('clash')) 追加UA = 'clash';
			else if (url.searchParams.has('singbox')) 追加UA = 'singbox';
			else if (url.searchParams.has('surge')) 追加UA = 'surge';
			else if (url.searchParams.has('quanx')) 追加UA = 'Quantumult%20X';
			else if (url.searchParams.has('loon')) 追加UA = 'Loon';

			const 订阅链接数组 = [...new Set(urls)].filter(item => item?.trim?.()); // 去重
			if (订阅链接数组.length > 0) {
				const 请求订阅响应内容 = await getSUB(订阅链接数组, request, 追加UA, userAgentHeader);
				console.log(请求订阅响应内容);
				req_data += 请求订阅响应内容[0].join('\n');
				订阅转换URL += "|" + 请求订阅响应内容[1];
				if (订阅格式 == 'base64' && !isSubConverterRequest && 请求订阅响应内容[1].includes('://')) {
					subConverterUrl = `${subProtocol}://${subConverter}/sub?target=mixed&url=${encodeURIComponent(请求订阅响应内容[1])}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
					try {
						const subConverterResponse = await fetch(subConverterUrl, { headers: { 'User-Agent': 'v2rayN/CF-Workers-SUB  (https://github.com/cmliu/CF-Workers-SUB)' } });
						if (subConverterResponse.ok) {
							const subConverterContent = await subConverterResponse.text();
							req_data += '\n' + atob(subConverterContent);
						}
					} catch (error) {
						console.log('订阅转换请回base64失败，检查订阅转换后端是否正常运行');
					}
				}
			}

			if (env.WARP) 订阅转换URL += "|" + (await ADD(env.WARP)).join("|");
			//修复中文错误
			const utf8Encoder = new TextEncoder();
			const encodedData = utf8Encoder.encode(req_data);
			//const text = String.fromCharCode.apply(null, encodedData);
			const utf8Decoder = new TextDecoder();
			const text = utf8Decoder.decode(encodedData);

			//去重
			const uniqueLines = new Set(text.split('\n'));
			const result = [...uniqueLines].join('\n');
			//console.log(result);

			let base64Data;
			try {
				base64Data = btoa(result);
			} catch (e) {
				function encodeBase64(data) {
					const binary = new TextEncoder().encode(data);
					let base64 = '';
					const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

					for (let i = 0; i < binary.length; i += 3) {
						const byte1 = binary[i];
						const byte2 = binary[i + 1] || 0;
						const byte3 = binary[i + 2] || 0;

						base64 += chars[byte1 >> 2];
						base64 += chars[((byte1 & 3) << 4) | (byte2 >> 4)];
						base64 += chars[((byte2 & 15) << 2) | (byte3 >> 6)];
						base64 += chars[byte3 & 63];
					}

					const padding = 3 - (binary.length % 3 || 3);
					return base64.slice(0, base64.length - padding) + '=='.slice(0, padding);
				}

				base64Data = encodeBase64(result)
			}

			// 构建响应头对象
			const responseHeaders = {
				"content-type": "text/plain; charset=utf-8",
				"Profile-Update-Interval": `${SUBUpdateTime}`,
				"Profile-web-page-url": request.url.includes('?') ? request.url.split('?')[0] : request.url,
				//"Subscription-Userinfo": `upload=${UD}; download=${UD}; total=${total}; expire=${expire}`,
			};

			if (订阅格式 == 'base64' || token == fakeToken) {
				return new Response(base64Data, { headers: responseHeaders });
			} else if (订阅格式 == 'clash') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=clash&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
			} else if (订阅格式 == 'singbox') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=singbox&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
			} else if (订阅格式 == 'surge') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=surge&ver=4&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
			} else if (订阅格式 == 'quanx') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=quanx&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&udp=true`;
			} else if (订阅格式 == 'loon') {
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=loon&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false`;
			}
			//console.log(订阅转换URL);
			try {
				const subConverterResponse = await fetch(subConverterUrl, { headers: { 'User-Agent': userAgentHeader } });//订阅转换
				if (!subConverterResponse.ok) return new Response(base64Data, { headers: responseHeaders });
				let subConverterContent = await subConverterResponse.text();
				if (订阅格式 == 'clash') subConverterContent = await clashFix(subConverterContent);
				// 只有非浏览器订阅才会返回SUBNAME
				if (!userAgent.includes('mozilla')) responseHeaders["Content-Disposition"] = `attachment; filename*=utf-8''${encodeURIComponent(FileName)}`;
				return new Response(subConverterContent, { headers: responseHeaders });
			} catch (error) {
				return new Response(base64Data, { headers: responseHeaders });
			}
		}
	}
};

async function ADD(envadd) {
	var addtext = envadd.replace(/[	"'|\r\n]+/g, '\n').replace(/\n+/g, '\n');	// 替换为换行
	//console.log(addtext);
	if (addtext.charAt(0) == '\n') addtext = addtext.slice(1);
	if (addtext.charAt(addtext.length - 1) == '\n') addtext = addtext.slice(0, addtext.length - 1);
	const add = addtext.split('\n');
	//console.log(add);
	return add;
}

async function nginx() {
	const text = `
	<!DOCTYPE html>
	<html>
	<head>
	<title>Welcome to nginx!</title>
	<style>
		body {
			width: 35em;
			margin: 0 auto;
			font-family: Tahoma, Verdana, Arial, sans-serif;
		}
	</style>
	</head>
	<body>
	<h1>Welcome to nginx!</h1>
	<p>If you see this page, the nginx web server is successfully installed and
	working. Further configuration is required.</p>
	
	<p>For online documentation and support please refer to
	<a href="http://nginx.org/">nginx.org</a>.<br/>
	Commercial support is available at
	<a href="http://nginx.com/">nginx.com</a>.</p>
	
	<p><em>Thank you for using nginx.</em></p>
	</body>
	</html>
	`
	return text;
}

async function sendMessage(type, ip, add_data = "") {
	if (BotToken !== '' && ChatID !== '') {
		let msg = "";
		const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
		if (response.status == 200) {
			const ipInfo = await response.json();
			msg = `${type}\nIP: ${ip}\n国家: ${ipInfo.country}\n<tg-spoiler>城市: ${ipInfo.city}\n组织: ${ipInfo.org}\nASN: ${ipInfo.as}\n${add_data}`;
		} else {
			msg = `${type}\nIP: ${ip}\n<tg-spoiler>${add_data}`;
		}

		let url = "https://api.telegram.org/bot" + BotToken + "/sendMessage?chat_id=" + ChatID + "&parse_mode=HTML&text=" + encodeURIComponent(msg);
		return fetch(url, {
			method: 'get',
			headers: {
				'Accept': 'text/html,application/xhtml+xml,application/xml;',
				'Accept-Encoding': 'gzip, deflate, br',
				'User-Agent': 'Mozilla/5.0 Chrome/90.0.4430.72'
			}
		});
	}
}

function base64Decode(str) {
	const bytes = new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)));
	const decoder = new TextDecoder('utf-8');
	return decoder.decode(bytes);
}

async function MD5MD5(text) {
	const encoder = new TextEncoder();

	const firstPass = await crypto.subtle.digest('MD5', encoder.encode(text));
	const firstPassArray = Array.from(new Uint8Array(firstPass));
	const firstHex = firstPassArray.map(b => b.toString(16).padStart(2, '0')).join('');

	const secondPass = await crypto.subtle.digest('MD5', encoder.encode(firstHex.slice(7, 27)));
	const secondPassArray = Array.from(new Uint8Array(secondPass));
	const secondHex = secondPassArray.map(b => b.toString(16).padStart(2, '0')).join('');

	return secondHex.toLowerCase();
}

function clashFix(content) {
	if (content.includes('wireguard') && !content.includes('remote-dns-resolve')) {
		let lines;
		if (content.includes('\r\n')) {
			lines = content.split('\r\n');
		} else {
			lines = content.split('\n');
		}

		let result = "";
		for (let line of lines) {
			if (line.includes('type: wireguard')) {
				const 备改内容 = `, mtu: 1280, udp: true`;
				const 正确内容 = `, mtu: 1280, remote-dns-resolve: true, udp: true`;
				result += line.replace(new RegExp(备改内容, 'g'), 正确内容) + '\n';
			} else {
				result += line + '\n';
			}
		}

		content = result;
	}
	return content;
}

async function proxyURL(proxyURL, url) {
	const URLs = await ADD(proxyURL);
	const fullURL = URLs[Math.floor(Math.random() * URLs.length)];

	// 解析目标 URL
	let parsedURL = new URL(fullURL);
	console.log(parsedURL);
	// 提取并可能修改 URL 组件
	let URLProtocol = parsedURL.protocol.slice(0, -1) || 'https';
	let URLHostname = parsedURL.hostname;
	let URLPathname = parsedURL.pathname;
	let URLSearch = parsedURL.search;

	// 处理 pathname
	if (URLPathname.charAt(URLPathname.length - 1) == '/') {
		URLPathname = URLPathname.slice(0, -1);
	}
	URLPathname += url.pathname;

	// 构建新的 URL
	let newURL = `${URLProtocol}://${URLHostname}${URLPathname}${URLSearch}`;

	// 反向代理请求
	let response = await fetch(newURL);

	// 创建新的响应
	let newResponse = new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});

	// 添加自定义头部，包含 URL 信息
	//newResponse.headers.set('X-Proxied-By', 'Cloudflare Worker');
	//newResponse.headers.set('X-Original-URL', fullURL);
	newResponse.headers.set('X-New-URL', newURL);

	return newResponse;
}

async function getSUB(api, request, 追加UA, userAgentHeader) {
	if (!api || api.length === 0) {
		return [];
	} else api = [...new Set(api)]; // 去重
	let newapi = "";
	let 订阅转换URLs = "";
	let 异常订阅 = "";
	const controller = new AbortController(); // 创建一个AbortController实例，用于取消请求
	const timeout = setTimeout(() => {
		controller.abort(); // 2秒后取消所有请求
	}, 2000);

	try {
		// 使用Promise.allSettled等待所有API请求完成，无论成功或失败
		const responses = await Promise.allSettled(api.map(apiUrl => getUrl(request, apiUrl, 追加UA, userAgentHeader).then(response => response.ok ? response.text() : Promise.reject(response))));

		// 遍历所有响应
		const modifiedResponses = responses.map((response, index) => {
			// 检查是否请求成功
			if (response.status === 'rejected') {
				const reason = response.reason;
				if (reason && reason.name === 'AbortError') {
					return {
						status: '超时',
						value: null,
						apiUrl: api[index] // 将原始的apiUrl添加到返回对象中
					};
				}
				console.error(`请求失败: ${api[index]}, 错误信息: ${reason.status} ${reason.statusText}`);
				return {
					status: '请求失败',
					value: null,
					apiUrl: api[index] // 将原始的apiUrl添加到返回对象中
				};
			}
			return {
				status: response.status,
				value: response.value,
				apiUrl: api[index] // 将原始的apiUrl添加到返回对象中
			};
		});

		console.log(modifiedResponses); // 输出修改后的响应数组

		for (const response of modifiedResponses) {
			// 检查响应状态是否为'fulfilled'
			if (response.status === 'fulfilled') {
				const content = await response.value || 'null'; // 获取响应的内容
				if (content.includes('proxies:')) {
					//console.log('Clash订阅: ' + response.apiUrl);
					订阅转换URLs += "|" + response.apiUrl; // Clash 配置
				} else if (content.includes('outbounds"') && content.includes('inbounds"')) {
					//console.log('Singbox订阅: ' + response.apiUrl);
					订阅转换URLs += "|" + response.apiUrl; // Singbox 配置
				} else if (content.includes('://')) {
					//console.log('明文订阅: ' + response.apiUrl);
					newapi += content + '\n'; // 追加内容
				} else if (isValidBase64(content)) {
					//console.log('Base64订阅: ' + response.apiUrl);
					newapi += base64Decode(content) + '\n'; // 解码并追加内容
				} else {
					const 异常订阅LINK = `trojan://CMLiussss@127.0.0.1:8888?security=tls&allowInsecure=1&type=tcp&headerType=none#%E5%BC%82%E5%B8%B8%E8%AE%A2%E9%98%85%20${response.apiUrl.split('://')[1].split('/')[0]}`;
					console.log('异常订阅: ' + 异常订阅LINK);
					异常订阅 += `${异常订阅LINK}\n`;
				}
			}
		}
	} catch (error) {
		console.error(error); // 捕获并输出错误信息
	} finally {
		clearTimeout(timeout); // 清除定时器
	}

	const 订阅内容 = await ADD(newapi + 异常订阅); // 将处理后的内容转换为数组
	// 返回处理后的结果
	return [订阅内容, 订阅转换URLs];
}

async function getUrl(request, targetUrl, 追加UA, userAgentHeader) {
	// 设置自定义 User-Agent
	const newHeaders = new Headers(request.headers);
	newHeaders.set("User-Agent", `${atob('djJyYXlOLzYuNDU=')} cmliu/CF-Workers-SUB ${追加UA}(${userAgentHeader})`);

	// 构建新的请求对象
	const modifiedRequest = new Request(targetUrl, {
		method: request.method,
		headers: newHeaders,
		body: request.method === "GET" ? null : request.body,
		redirect: "follow",
		cf: {
			// 忽略SSL证书验证
			insecureSkipVerify: true,
			// 允许自签名证书
			allowUntrusted: true,
			// 禁用证书验证
			validateCertificate: false
		}
	});

	// 输出请求的详细信息
	console.log(`请求URL: ${targetUrl}`);
	console.log(`请求头: ${JSON.stringify([...newHeaders])}`);
	console.log(`请求方法: ${request.method}`);
	console.log(`请求体: ${request.method === "GET" ? null : request.body}`);

	// 发送请求并返回响应
	return fetch(modifiedRequest);
}

function isValidBase64(str) {
	// 先移除所有空白字符(空格、换行、回车等)
	const cleanStr = str.replace(/\s/g, '');
	const base64Regex = /^[A-Za-z0-9+/=]+$/;
	return base64Regex.test(cleanStr);
}

async function 迁移地址列表(env, txt = 'ADD.txt') {
	try {
		const 旧数据 = await env.KV.get(`/${txt}`);
		const 新数据 = await env.KV.get(txt);

		if (旧数据 && !新数据) {
			// 写入新位置
			await env.KV.put(txt, 旧数据);
			// 删除旧数据
			await env.KV.delete(`/${txt}`);
			return true;
		}
	} catch (error) {
		console.error('迁移KV数据时发生错误:', error);
	}
	return false;
}

function escapeHTML(value) {
	return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
		return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
	});
}

async function KV(request, env, txt = 'ADD.txt', guest) {
	const url = new URL(request.url);
	try {
		// POST request handling
		if (request.method === "POST") {
			if (!env.KV) return new Response("未绑定KV空间", { status: 400 });
			try {
				const content = await request.text();
				await env.KV.put(txt, content);
				return new Response("保存成功");
			} catch (error) {
				console.error('保存KV时发生错误:', error);
				return new Response("保存失败: " + error.message, { status: 500 });
			}
		}

		// GET request
		const hasKV = !!env.KV;
		let content = '';
		let readError = '';

		if (hasKV) {
			try {
				content = await env.KV.get(txt) || '';
			} catch (error) {
				console.error('读取KV时发生错误:', error);
				readError = error.message;
			}
		}

		const origin = url.origin;
		const ownerBase = `${origin}/${mytoken}`;
		const guestBase = `${origin}/sub?token=${encodeURIComponent(guest)}`;
		const formats = [
			{ id: 'auto', label: '自适应', ownerSuffix: '?sub', guestSuffix: '', hint: '按客户端 UA 自动匹配；浏览器打开直接返回订阅' },
			{ id: 'b64', label: 'Base64', ownerSuffix: '?b64', guestSuffix: '&b64', hint: '通用 Base64 节点列表，适配 v2rayN / NekoBox' },
			{ id: 'clash', label: 'Clash', ownerSuffix: '?clash', guestSuffix: '&clash', hint: 'Clash / Mihomo 配置，由订阅转换后端生成' },
			{ id: 'sb', label: 'Sing-Box', ownerSuffix: '?sb', guestSuffix: '&sb', hint: 'Sing-Box 配置，由订阅转换后端生成' },
			{ id: 'surge', label: 'Surge', ownerSuffix: '?surge', guestSuffix: '&surge', hint: 'Surge 4 配置，由订阅转换后端生成' },
			{ id: 'loon', label: 'Loon', ownerSuffix: '?loon', guestSuffix: '&loon', hint: 'Loon 配置，由订阅转换后端生成' }
		];

		const tabsHtml = formats.map(function (format) {
			const active = format.id === 'auto';
			return `<button type="button" class="tab${active ? ' is-active' : ''}" role="tab" aria-selected="${active ? 'true' : 'false'}" data-format="${format.id}" data-owner="${escapeHTML(ownerBase + format.ownerSuffix)}" data-guest="${escapeHTML(guestBase + format.guestSuffix)}" data-hint="${escapeHTML(format.hint)}">${format.label}</button>`;
		}).join('');

		const editorHtml = !hasKV
			? `<div class="notice notice-warn">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>
					<div>
						<strong>未绑定 KV 命名空间</strong>
						<p>当前页面无法在线编辑节点配置。请在 Cloudflare 控制台绑定变量名为 <code>KV</code> 的 KV 命名空间后刷新本页。</p>
					</div>
				</div>`
			: readError
				? `<div class="notice notice-error">
					<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/></svg>
					<div>
						<strong>读取配置失败</strong>
						<p>为避免覆盖现有数据，编辑器已停用。KV 返回：<code>${escapeHTML(readError)}</code></p>
					</div>
				</div>`
				: `<div class="editor-meta">
						<span class="chip"><b id="statNodes">0</b>节点</span>
						<span class="chip"><b id="statSubs">0</b>订阅源</span>
						<span class="chip"><b id="statLines">0</b>行</span>
						<span class="chip chip-muted">LINK.txt</span>
					</div>
					<div class="editor-wrap">
						<textarea id="content" class="editor" aria-label="节点与订阅源" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="每行一个节点链接或订阅链接，例如 ss:// / vmess:// / https://...">${escapeHTML(content)}</textarea>
					</div>
					<div class="editor-foot">
						<span>支持 ss / vmess / vless / trojan / hysteria2 / tuic 等协议</span>
						<span class="kbd-hint"><kbd>⌘S</kbd> / <kbd>Ctrl+S</kbd> 保存</span>
					</div>`;

		const titleSafe = escapeHTML(FileName);
		const guestSafe = escapeHTML(guest);
		const uaSafe = escapeHTML(request.headers.get('User-Agent') || 'Unknown');
		const subApiSafe = escapeHTML(`${subProtocol}://${subConverter}`);
		const subConfigSafe = escapeHTML(subConfig);
		const backendHost = escapeHTML(subConverter.split('/')[0]);

		const html = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="theme-color" content="#060910">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2032%2032'%3E%3Crect%20width='32'%20height='32'%20rx='8'%20fill='%230e7490'/%3E%3Cpath%20d='M16%207l9%205-9%205-9-5%209-5Z'%20fill='none'%20stroke='white'%20stroke-width='2'%20stroke-linejoin='round'/%3E%3Cpath%20d='M7%2021l9%205%209-5'%20fill='none'%20stroke='white'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'/%3E%3C/svg%3E">
<title>${titleSafe} · 订阅管理</title>
<script>
(function () {
	try {
		var stored = localStorage.getItem('cfnode.theme');
		var theme = stored === 'light' || stored === 'dark' ? stored : (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
		document.documentElement.setAttribute('data-theme', theme);
		var meta = document.querySelector('meta[name="theme-color"]');
		if (meta) meta.setAttribute('content', theme === 'dark' ? '#060910' : '#f3f5fa');
	} catch (e) {}
})();
</script>
<style>
:root {
	color-scheme: dark;
	--bg: #060910;
	--surface: rgba(17, 23, 38, .74);
	--surface-solid: #0e1422;
	--surface-2: rgba(255, 255, 255, .035);
	--field: rgba(4, 8, 16, .55);
	--border: rgba(148, 163, 184, .13);
	--border-strong: rgba(148, 163, 184, .24);
	--text: #e9eef8;
	--muted: #9aa7bd;
	--faint: #7c88a0;
	--accent: #22d3ee;
	--accent-2: #818cf8;
	--accent-contrast: #04121a;
	--accent-soft: rgba(34, 211, 238, .12);
	--accent-line: rgba(34, 211, 238, .32);
	--ok: #34d399;
	--warn: #fbbf24;
	--danger: #fb7185;
	--shadow: 0 24px 64px -28px rgba(0, 0, 0, .75);
	--radius: 16px;
	--sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif;
	--mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
}

:root[data-theme="light"] {
	color-scheme: light;
	--bg: #f3f5fa;
	--surface: rgba(255, 255, 255, .88);
	--surface-solid: #ffffff;
	--surface-2: rgba(15, 23, 42, .034);
	--field: rgba(255, 255, 255, .92);
	--border: rgba(15, 23, 42, .09);
	--border-strong: rgba(15, 23, 42, .18);
	--text: #0c1424;
	--muted: #556173;
	--faint: #677386;
	--accent: #0e7490;
	--accent-2: #4338ca;
	--accent-contrast: #ffffff;
	--accent-soft: rgba(14, 116, 144, .1);
	--accent-line: rgba(14, 116, 144, .3);
	--ok: #059669;
	--warn: #b45309;
	--danger: #e11d48;
	--shadow: 0 24px 60px -32px rgba(15, 23, 42, .35);
}

* { box-sizing: border-box; }
[hidden] { display: none !important; }

html { -webkit-text-size-adjust: 100%; }

body {
	margin: 0;
	min-height: 100vh;
	background: var(--bg);
	color: var(--text);
	font-family: var(--sans);
	font-size: 14px;
	line-height: 1.55;
	-webkit-font-smoothing: antialiased;
	text-rendering: optimizeLegibility;
}

body::before,
body::after {
	content: "";
	position: fixed;
	inset: 0;
	z-index: -1;
	pointer-events: none;
}

body::before {
	background:
		radial-gradient(58rem 38rem at 6% -12%, rgba(34, 211, 238, .13), transparent 62%),
		radial-gradient(52rem 34rem at 98% 0%, rgba(129, 140, 248, .12), transparent 60%);
}

body::after {
	background-image:
		linear-gradient(rgba(148, 163, 184, .04) 1px, transparent 1px),
		linear-gradient(90deg, rgba(148, 163, 184, .04) 1px, transparent 1px);
	background-size: 56px 56px;
	-webkit-mask-image: radial-gradient(ellipse 90% 62% at 50% 0%, #000 15%, transparent 76%);
	mask-image: radial-gradient(ellipse 90% 62% at 50% 0%, #000 15%, transparent 76%);
}

:root[data-theme="light"] body::before {
	background:
		radial-gradient(58rem 38rem at 6% -12%, rgba(8, 145, 178, .09), transparent 62%),
		radial-gradient(52rem 34rem at 98% 0%, rgba(79, 70, 229, .08), transparent 60%);
}

:root[data-theme="light"] body::after {
	background-image:
		linear-gradient(rgba(15, 23, 42, .035) 1px, transparent 1px),
		linear-gradient(90deg, rgba(15, 23, 42, .035) 1px, transparent 1px);
}

.page {
	width: 100%;
	max-width: 1200px;
	margin: 0 auto;
	padding: 28px 32px 40px;
}

.topbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 4px 2px 22px;
}

.brand {
	display: flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
}

.brand-mark {
	display: grid;
	place-items: center;
	width: 38px;
	height: 38px;
	flex: none;
	border-radius: 11px;
	background: linear-gradient(135deg, var(--accent), var(--accent-2));
	color: var(--accent-contrast);
	box-shadow: 0 8px 22px -10px var(--accent-line);
}

.brand-mark svg { width: 19px; height: 19px; }

.brand-text { min-width: 0; }

.brand-text h1 {
	margin: 0;
	font-size: 16px;
	font-weight: 650;
	letter-spacing: -.01em;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.brand-text p {
	margin: 2px 0 0;
	font-size: 12px;
	color: var(--muted);
}

.topbar-actions {
	display: flex;
	align-items: center;
	gap: 10px;
	flex: none;
}

.pill {
	display: inline-flex;
	align-items: center;
	gap: 7px;
	height: 30px;
	padding: 0 11px;
	border: 1px solid var(--border);
	border-radius: 999px;
	background: var(--surface-2);
	font-size: 12px;
	color: var(--muted);
	white-space: nowrap;
}

.dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: var(--ok);
	box-shadow: 0 0 0 3px rgba(52, 211, 153, .14);
}

.pill.warn .dot {
	background: var(--warn);
	box-shadow: 0 0 0 3px rgba(251, 191, 36, .14);
}

.icon-btn {
	display: grid;
	place-items: center;
	width: 34px;
	height: 34px;
	padding: 0;
	border: 1px solid var(--border);
	border-radius: 9px;
	background: var(--surface-2);
	color: var(--muted);
	cursor: pointer;
	transition: color .15s ease, border-color .15s ease, background .15s ease;
}

.icon-btn:hover {
	color: var(--text);
	border-color: var(--border-strong);
	background: var(--surface-solid);
}

.icon-btn:focus-visible,
.btn:focus-visible,
.tab:focus-visible,
.seg-btn:focus-visible,
.copy-mini:focus-visible {
	outline: 2px solid var(--accent);
	outline-offset: 2px;
}

.icon-btn svg { width: 16px; height: 16px; }
:root[data-theme="dark"] .icon-moon { display: none; }
:root[data-theme="light"] .icon-sun { display: none; }

.card {
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	box-shadow: var(--shadow);
	-webkit-backdrop-filter: blur(14px);
	backdrop-filter: blur(14px);
}

.sub-card {
	position: relative;
	overflow: hidden;
	padding: 22px 24px 18px;
}

.sub-card::before {
	content: "";
	position: absolute;
	inset: 0 0 auto;
	height: 1px;
	background: linear-gradient(90deg, transparent, var(--accent-line), transparent);
}

.card-head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 18px;
	flex-wrap: wrap;
}

.head-text { min-width: 0; }

.card-head h2 {
	margin: 0;
	font-size: 15px;
	font-weight: 640;
	letter-spacing: -.01em;
}

.sub {
	margin: 3px 0 0;
	font-size: 12.5px;
	color: var(--muted);
}

.segmented {
	display: inline-flex;
	gap: 2px;
	padding: 3px;
	border: 1px solid var(--border);
	border-radius: 10px;
	background: var(--field);
}

.seg-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	height: 28px;
	padding: 0 12px;
	border: 0;
	border-radius: 7px;
	background: transparent;
	color: var(--muted);
	font: inherit;
	font-size: 12.5px;
	font-weight: 550;
	cursor: pointer;
	transition: color .15s ease, background .15s ease, box-shadow .15s ease;
}

.seg-btn svg { width: 14px; height: 14px; }
.seg-btn:hover { color: var(--text); }

.seg-btn.is-active {
	background: var(--surface-solid);
	color: var(--text);
	box-shadow: inset 0 0 0 1px var(--border);
}

.field { margin-top: 18px; }

.field-top {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 8px;
}

.field-label {
	font-size: 11.5px;
	font-weight: 600;
	letter-spacing: .06em;
	color: var(--faint);
}

.field-hint {
	font-size: 12px;
	color: var(--faint);
	text-align: right;
}

.tabs {
	display: flex;
	gap: 2px;
	padding: 3px;
	border: 1px solid var(--border);
	border-radius: 11px;
	background: var(--field);
	overflow-x: auto;
	scrollbar-width: none;
}

.tabs::-webkit-scrollbar { display: none; }

.tab {
	flex: 0 0 auto;
	height: 30px;
	padding: 0 13px;
	border: 0;
	border-radius: 8px;
	background: transparent;
	color: var(--muted);
	font: inherit;
	font-size: 12.5px;
	font-weight: 550;
	white-space: nowrap;
	cursor: pointer;
	transition: color .15s ease, background .15s ease, box-shadow .15s ease;
}

.tab:hover {
	color: var(--text);
	background: var(--surface-2);
}

.tab.is-active {
	background: var(--accent-soft);
	color: var(--accent);
	box-shadow: inset 0 0 0 1px var(--accent-line);
}

.url-box {
	display: flex;
	align-items: stretch;
	gap: 10px;
	margin-top: 12px;
}

.url-input {
	flex: 1;
	min-width: 0;
	height: 44px;
	padding: 0 14px;
	border: 1px solid var(--border);
	border-radius: 11px;
	background: var(--field);
	color: var(--text);
	font-family: var(--mono);
	font-size: 12.5px;
	letter-spacing: -.01em;
}

.url-input:focus {
	outline: none;
	border-color: var(--accent-line);
	box-shadow: 0 0 0 3px var(--accent-soft);
}

.url-actions {
	display: flex;
	gap: 8px;
	flex: none;
}

.btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 7px;
	height: 40px;
	padding: 0 14px;
	border: 1px solid transparent;
	border-radius: 10px;
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	white-space: nowrap;
	cursor: pointer;
	transition: transform .12s ease, background .15s ease, border-color .15s ease, color .15s ease, opacity .15s ease;
}

.btn svg { width: 15px; height: 15px; }
.btn:active { transform: translateY(1px); }

.btn-primary {
	background: var(--accent);
	color: var(--accent-contrast);
}

.btn-primary:hover { filter: brightness(1.06); }

.btn-primary:disabled {
	opacity: .6;
	cursor: default;
	transform: none;
}

.btn-ghost {
	border-color: var(--border);
	background: var(--surface-2);
	color: var(--text);
}

.btn-ghost:hover {
	border-color: var(--border-strong);
	background: var(--surface-solid);
}

.btn-ghost.is-active {
	border-color: var(--accent-line);
	background: var(--accent-soft);
	color: var(--accent);
}

.btn-sm {
	height: 34px;
	padding: 0 12px;
	font-size: 12.5px;
}

.qr-panel {
	display: flex;
	align-items: center;
	gap: 18px;
	margin-top: 12px;
	padding: 16px;
	border: 1px dashed var(--border-strong);
	border-radius: 12px;
	background: var(--surface-2);
}

.qr-frame {
	display: grid;
	place-items: center;
	width: 168px;
	height: 168px;
	flex: none;
	padding: 10px;
	border-radius: 10px;
	background: #ffffff;
}

#qrcode { width: 148px; height: 148px; }
#qrcode canvas,
#qrcode img { width: 148px !important; height: 148px !important; display: block; }

.qr-copy strong {
	display: block;
	font-size: 13px;
	font-weight: 600;
}

.qr-copy p {
	margin: 4px 0 0;
	font-size: 12px;
	color: var(--muted);
}

.guest-note {
	display: flex;
	align-items: flex-start;
	gap: 10px;
	margin-top: 12px;
	padding: 12px 14px;
	border: 1px solid rgba(251, 191, 36, .24);
	border-radius: 11px;
	background: rgba(251, 191, 36, .07);
	font-size: 12.5px;
	color: var(--muted);
}

.guest-note > svg {
	width: 16px;
	height: 16px;
	flex: none;
	margin-top: 2px;
	color: var(--warn);
}

.guest-note p { margin: 0; }
.guest-note strong { color: var(--text); font-weight: 600; }

.guest-token {
	display: flex;
	align-items: center;
	gap: 7px;
	margin-top: 7px;
	font-size: 10.5px;
	font-weight: 600;
	letter-spacing: .06em;
	color: var(--faint);
}

.guest-token code {
	font-family: var(--mono);
	font-size: 11.5px;
	font-weight: 400;
	letter-spacing: 0;
	color: var(--text);
	word-break: break-all;
}

.sub-foot {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px 14px;
	margin-top: 16px;
	padding-top: 14px;
	border-top: 1px solid var(--border);
	font-size: 12px;
	color: var(--faint);
}

.sub-foot strong {
	color: var(--muted);
	font-weight: 550;
}

.meta-divider {
	width: 1px;
	height: 10px;
	background: var(--border-strong);
}

.content-grid {
	display: grid;
	grid-template-columns: minmax(0, 1.72fr) minmax(280px, .9fr);
	align-items: start;
	gap: 16px;
	margin-top: 16px;
}

.content-grid > * { min-width: 0; }

.editor-card { padding: 20px 22px; }

.save-cluster {
	display: flex;
	align-items: center;
	gap: 10px;
}

.save-status {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	color: var(--faint);
	white-space: nowrap;
}

.status-dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: var(--faint);
}

.save-status[data-state="dirty"] { color: var(--muted); }
.save-status[data-state="dirty"] .status-dot { background: var(--warn); }
.save-status[data-state="busy"] .status-dot { background: var(--accent); animation: pulse 1s ease-in-out infinite; }
.save-status[data-state="ok"] .status-dot { background: var(--ok); }
.save-status[data-state="error"] { color: var(--danger); }
.save-status[data-state="error"] .status-dot { background: var(--danger); }

@keyframes pulse {
	50% { opacity: .3; }
}

.editor-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin: 14px 0 10px;
}

.chip {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 26px;
	padding: 0 10px;
	border: 1px solid var(--border);
	border-radius: 999px;
	background: var(--surface-2);
	font-size: 11.5px;
	color: var(--muted);
}

.chip b {
	color: var(--text);
	font-weight: 650;
	font-variant-numeric: tabular-nums;
}

.chip-muted {
	font-family: var(--mono);
	font-size: 11px;
	color: var(--faint);
}

.editor-wrap { position: relative; }

.editor {
	display: block;
	width: 100%;
	min-height: 360px;
	max-height: 620px;
	padding: 14px 16px;
	border: 1px solid var(--border);
	border-radius: 12px;
	background: var(--field);
	color: var(--text);
	font-family: var(--mono);
	font-size: 12.5px;
	line-height: 1.7;
	resize: vertical;
	tab-size: 2;
}

.editor::placeholder { color: var(--faint); }

.editor:focus {
	outline: none;
	border-color: var(--accent-line);
	box-shadow: 0 0 0 3px var(--accent-soft);
}

.editor::-webkit-scrollbar { width: 10px; height: 10px; }
.editor::-webkit-scrollbar-thumb {
	background: var(--border-strong);
	border: 3px solid transparent;
	border-radius: 99px;
	background-clip: content-box;
}

.editor-foot {
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 8px 12px;
	margin-top: 10px;
	font-size: 11.5px;
	color: var(--faint);
}

.kbd-hint { white-space: nowrap; }

kbd {
	padding: 1px 5px;
	border: 1px solid var(--border);
	border-radius: 4px;
	background: var(--surface-2);
	font-family: var(--mono);
	font-size: 10.5px;
	color: var(--muted);
}

.notice {
	display: flex;
	align-items: flex-start;
	gap: 10px;
	margin-top: 14px;
	padding: 14px 16px;
	border: 1px solid var(--border);
	border-radius: 11px;
	background: var(--surface-2);
	font-size: 12.5px;
	color: var(--muted);
}

.notice svg {
	width: 17px;
	height: 17px;
	flex: none;
	margin-top: 2px;
	fill: none;
	stroke: currentColor;
	stroke-width: 1.7;
	stroke-linecap: round;
	stroke-linejoin: round;
}

.notice strong {
	display: block;
	margin-bottom: 2px;
	color: var(--text);
	font-weight: 600;
}

.notice p { margin: 0; }

.notice code {
	padding: 1px 5px;
	border-radius: 4px;
	background: var(--field);
	font-family: var(--mono);
	font-size: 11.5px;
}

.notice-warn {
	border-color: rgba(251, 191, 36, .24);
	background: rgba(251, 191, 36, .06);
}

.notice-warn svg { color: var(--warn); }

.notice-error {
	border-color: rgba(251, 113, 133, .26);
	background: rgba(251, 113, 133, .06);
}

.notice-error svg { color: var(--danger); }

.side {
	display: grid;
	gap: 16px;
	min-width: 0;
}

.side .card {
	min-width: 0;
	padding: 18px 20px;
}

.side-title {
	margin: 0 0 14px;
	font-size: 13px;
	font-weight: 650;
	letter-spacing: -.005em;
}

.proto-list { display: grid; gap: 10px; }

.proto-row {
	display: grid;
	grid-template-columns: 76px minmax(0, 1fr) 26px;
	align-items: center;
	gap: 10px;
}

.proto-name {
	font-family: var(--mono);
	font-size: 11.5px;
	color: var(--muted);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.proto-track {
	height: 6px;
	border: 1px solid var(--border);
	border-radius: 99px;
	background: var(--surface-2);
	overflow: hidden;
}

.proto-bar {
	display: block;
	height: 100%;
	border-radius: 99px;
	background: linear-gradient(90deg, var(--accent), var(--accent-2));
}

.proto-count {
	font-size: 11.5px;
	color: var(--text);
	text-align: right;
	font-variant-numeric: tabular-nums;
}

.empty {
	margin: 0;
	font-size: 12px;
	color: var(--faint);
}

.side-divider {
	height: 1px;
	margin: 14px 0;
	background: var(--border);
}

.side-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	font-size: 12px;
	color: var(--faint);
}

.side-row + .side-row { margin-top: 8px; }

.side-value {
	color: var(--muted);
	text-align: right;
}

.kv-row {
	padding: 10px 0;
	border-top: 1px solid var(--border);
}

.kv-row:first-of-type {
	padding-top: 0;
	border-top: 0;
}

.kv-row:last-of-type { padding-bottom: 0; }

.kv-label {
	display: block;
	margin-bottom: 4px;
	font-size: 10.5px;
	font-weight: 600;
	letter-spacing: .07em;
	color: var(--faint);
}

.kv-line {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
}

.kv-value {
	flex: 1;
	min-width: 0;
	font-family: var(--mono);
	font-size: 11.5px;
	color: var(--muted);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.copy-mini {
	display: grid;
	place-items: center;
	width: 26px;
	height: 26px;
	flex: none;
	padding: 0;
	border: 1px solid var(--border);
	border-radius: 7px;
	background: var(--surface-2);
	color: var(--faint);
	cursor: pointer;
	transition: color .15s ease, border-color .15s ease;
}

.copy-mini:hover {
	color: var(--text);
	border-color: var(--border-strong);
}

.copy-mini svg { width: 13px; height: 13px; }

.side-note {
	margin: 12px 0 0;
	font-size: 11.5px;
	line-height: 1.6;
	color: var(--faint);
}

.footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 10px 16px;
	margin-top: 26px;
	padding: 0 2px;
	font-size: 11.5px;
	color: var(--faint);
}

.footer-left {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
	max-width: 72%;
}

.footer-label {
	font-size: 10px;
	font-weight: 600;
	letter-spacing: .08em;
	color: var(--faint);
}

.ua {
	font-family: var(--mono);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.footer-right {
	display: flex;
	align-items: center;
	gap: 10px;
}

.footer a {
	color: var(--muted);
	text-decoration: none;
	transition: color .15s ease;
}

.footer a:hover { color: var(--accent); }

.toast {
	position: fixed;
	left: 50%;
	bottom: 26px;
	z-index: 50;
	display: flex;
	align-items: center;
	gap: 8px;
	max-width: calc(100vw - 32px);
	padding: 10px 16px;
	border: 1px solid var(--border-strong);
	border-radius: 999px;
	background: var(--surface-solid);
	color: var(--text);
	font-size: 12.5px;
	box-shadow: var(--shadow);
	opacity: 0;
	transform: translate(-50%, 12px);
	pointer-events: none;
	transition: opacity .18s ease, transform .18s ease;
}

.toast.is-visible {
	opacity: 1;
	transform: translate(-50%, 0);
}

.toast .dot { background: var(--ok); }
.toast[data-kind="error"] .dot { background: var(--danger); }

@media (max-width: 900px) {
	.content-grid { grid-template-columns: 1fr; }
	.side { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 720px) {
	.page { padding: 18px 16px 32px; }
	.topbar { padding-bottom: 16px; }
	.sub-card { padding: 18px 16px 14px; }
	.editor-card { padding: 18px 16px; }
	.segmented { width: 100%; }
	.seg-btn { flex: 1; height: 34px; }
	.field-top { flex-direction: column; gap: 3px; }
	.field-hint { text-align: left; }
	.url-box { flex-wrap: wrap; }
	.url-input { flex: 1 1 100%; }
	.url-actions { width: 100%; }
	.url-actions .btn { flex: 1; }
	.tabs {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 4px;
	}
	.tab { width: 100%; height: 36px; padding: 0 8px; }
	.btn-sm { height: 36px; }
	.copy-mini { width: 30px; height: 30px; }
	.kbd-hint { display: none; }
	.sub-foot .meta-divider { display: none; }
	.qr-panel { flex-direction: column; align-items: flex-start; }
	.save-cluster { width: 100%; justify-content: space-between; }
	.side { grid-template-columns: 1fr; }
	.footer-left { max-width: 100%; }
	.content-grid { margin-top: 12px; }
}

@media (max-width: 460px) {
	.brand-text h1 { font-size: 15px; }
	.pill { display: none; }
	.tab { padding: 0 11px; }
	.sub-foot { gap: 6px 10px; }
}

@media (prefers-reduced-motion: reduce) {
	*,
	*::before,
	*::after {
		animation-duration: .01ms !important;
		animation-iteration-count: 1 !important;
		transition-duration: .01ms !important;
	}
}
</style>
</head>
<body>
<div class="page">
	<header class="topbar">
		<div class="brand">
			<span class="brand-mark" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z"/><path d="m4 12 8 4.5 8-4.5"/><path d="m4 16.5 8 4.5 8-4.5"/></svg>
			</span>
			<div class="brand-text">
				<h1>${titleSafe}</h1>
				<p>订阅聚合控制台</p>
			</div>
		</div>
		<div class="topbar-actions">
			<span class="pill${hasKV ? '' : ' warn'}" title="${hasKV ? '配置存储于 Cloudflare KV' : '未绑定 KV 命名空间'}"><span class="dot"></span>${hasKV ? 'KV 已连接' : 'KV 未绑定'}</span>
			<button class="icon-btn" id="themeToggle" type="button" aria-label="切换主题" title="切换主题">
				<svg class="icon icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
				<svg class="icon icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"/></svg>
			</button>
		</div>
	</header>

	<main class="layout">
		<section class="card sub-card" aria-labelledby="subTitle">
			<div class="card-head">
				<div class="head-text">
					<h2 id="subTitle">订阅地址</h2>
					<p class="sub">选择输出格式，复制链接或扫码导入客户端</p>
				</div>
				<div class="segmented" role="tablist" aria-label="订阅身份">
					<button type="button" class="seg-btn is-active" role="tab" aria-selected="true" data-mode="owner">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
						我的订阅
					</button>
					<button type="button" class="seg-btn" role="tab" aria-selected="false" data-mode="guest">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/></svg>
						访客订阅
					</button>
				</div>
			</div>

			<div class="field">
				<div class="field-top">
					<span class="field-label">输出格式</span>
					<span class="field-hint" id="formatHint">按客户端 UA 自动匹配；浏览器打开直接返回订阅</span>
				</div>
				<div class="tabs" role="tablist" aria-label="订阅格式">
					${tabsHtml}
				</div>
			</div>

			<div class="url-box">
				<input id="subUrl" class="url-input" type="text" readonly spellcheck="false" value="${escapeHTML(ownerBase + '?sub')}" aria-label="订阅地址">
				<div class="url-actions">
					<button class="btn btn-primary" id="copyBtn" type="button">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
						复制
					</button>
					<button class="btn btn-ghost" id="qrBtn" type="button" aria-expanded="false" aria-controls="qrPanel">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM21 14v.01M14 21v.01M21 21v.01M18 18h.01M18 21h.01M21 18h.01"/></svg>
						二维码
					</button>
				</div>
			</div>

			<div class="qr-panel" id="qrPanel" hidden>
				<div class="qr-frame"><div id="qrcode"></div></div>
				<div class="qr-copy">
					<strong>扫码导入</strong>
					<p id="qrNote">二维码在本地生成，不会上传到服务器</p>
				</div>
			</div>

			<div class="guest-note" id="guestNote" hidden>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M12 8v4M12 16h.01"/></svg>
				<div class="guest-note-body">
					<p><strong>访客模式</strong> 仅提供订阅能力，无法进入本配置页；如需停用，轮换 <code>GUEST</code> 变量即可。</p>
					<div class="guest-token">TOKEN <code id="guestToken">${guestSafe}</code><button type="button" class="copy-mini" data-copy="guestToken" aria-label="复制访客 TOKEN"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></button></div>
				</div>
			</div>

			<div class="sub-foot">
				<span>更新间隔 <strong>${SUBUpdateTime}h</strong></span>
				<span class="meta-divider" aria-hidden="true"></span>
				<span>转换后端 <strong>${backendHost}</strong></span>
				<span class="meta-divider" aria-hidden="true"></span>
				<span>自动去重 · 兼容 Clash / Sing-Box / Surge / Loon</span>
			</div>
		</section>

		<div class="content-grid">
			<section class="card editor-card" aria-labelledby="editorTitle">
				<div class="card-head editor-head">
					<div class="head-text">
						<h2 id="editorTitle">节点与订阅源</h2>
						<p class="sub">每行一个节点链接或订阅链接，修改后自动保存</p>
					</div>
					<div class="save-cluster">
						<span class="save-status" id="saveStatus" data-state="idle" aria-live="polite"><span class="status-dot"></span><span id="saveStatusText">自动保存已开启</span></span>
						<button class="btn btn-primary btn-sm" id="saveBtn" type="button">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>
							<span>保存</span>
						</button>
					</div>
				</div>
				${editorHtml}
			</section>

			<aside class="side">
				<section class="card" aria-labelledby="protoTitle">
					<h2 class="side-title" id="protoTitle">节点构成</h2>
					<div class="proto-list" id="protoList"><p class="empty">暂无节点</p></div>
					<div class="side-divider"></div>
					<div class="side-row"><span>存储</span><span class="side-value">${hasKV ? 'Cloudflare KV · LINK.txt' : '未绑定 KV'}</span></div>
					<div class="side-row"><span>自动保存</span><span class="side-value">${hasKV && !readError ? '5 秒防抖 + 失焦保存' : '—'}</span></div>
				</section>

				<section class="card" aria-labelledby="convertTitle">
					<h2 class="side-title" id="convertTitle">订阅转换</h2>
					<div class="kv-row">
						<span class="kv-label">SUBAPI</span>
						<div class="kv-line">
							<code class="kv-value" id="subApi" title="${subApiSafe}">${subApiSafe}</code>
							<button type="button" class="copy-mini" data-copy="subApi" aria-label="复制 SUBAPI"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></button>
						</div>
					</div>
					<div class="kv-row">
						<span class="kv-label">SUBCONFIG</span>
						<div class="kv-line">
							<code class="kv-value" id="subConfig" title="${subConfigSafe}">${subConfigSafe}</code>
							<button type="button" class="copy-mini" data-copy="subConfig" aria-label="复制 SUBCONFIG"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></button>
						</div>
					</div>
					<p class="side-note">Clash / Sing-Box / Surge / Loon 格式由该后端与配置生成。</p>
				</section>
			</aside>
		</div>
	</main>

	<footer class="footer">
		<div class="footer-left"><span class="footer-label">UA</span><span class="ua">${uaSafe}</span></div>
		<div class="footer-right">
			<a href="https://github.com/cmliu/CF-Workers-SUB" target="_blank" rel="noopener noreferrer">CF-Workers-SUB</a>
			<span class="meta-divider" aria-hidden="true"></span>
			<a href="https://t.me/CMLiussss" target="_blank" rel="noopener noreferrer">Telegram</a>
		</div>
	</footer>
</div>

<div class="toast" id="toast" role="status" aria-live="polite"></div>

<script>
(function () {
	'use strict';

	var root = document.documentElement;
	var THEME_KEY = 'cfnode.theme';
	var themeBtn = document.getElementById('themeToggle');

	function setTheme(theme) {
		root.setAttribute('data-theme', theme);
		if (themeBtn) {
			var label = theme === 'dark' ? '切换到浅色主题' : '切换到深色主题';
			themeBtn.setAttribute('aria-label', label);
			themeBtn.setAttribute('title', label);
		}
		var meta = document.querySelector('meta[name="theme-color"]');
		if (meta) meta.setAttribute('content', theme === 'dark' ? '#060910' : '#f3f5fa');
	}

	setTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

	if (themeBtn) {
		themeBtn.addEventListener('click', function () {
			var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
			setTheme(next);
			try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
		});
	}

	var toastEl = document.getElementById('toast');
	var toastTimer = null;

	function toast(message, kind) {
		if (!toastEl) return;
		toastEl.textContent = '';
		var dot = document.createElement('span');
		dot.className = 'dot';
		var text = document.createElement('span');
		text.textContent = message;
		toastEl.appendChild(dot);
		toastEl.appendChild(text);
		toastEl.setAttribute('data-kind', kind || 'success');
		toastEl.classList.add('is-visible');
		clearTimeout(toastTimer);
		toastTimer = setTimeout(function () {
			toastEl.classList.remove('is-visible');
		}, 2200);
	}

	function fallbackCopy(text) {
		var area = document.createElement('textarea');
		area.value = text;
		area.setAttribute('readonly', '');
		area.style.position = 'fixed';
		area.style.top = '-1000px';
		area.style.opacity = '0';
		document.body.appendChild(area);
		area.select();
		var ok = false;
		try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
		document.body.removeChild(area);
		return ok ? Promise.resolve() : Promise.reject(new Error('copy failed'));
	}

	function copyText(text) {
		if (!text) return Promise.reject(new Error('empty'));
		if (navigator.clipboard && window.isSecureContext) {
			return navigator.clipboard.writeText(text);
		}
		return fallbackCopy(text);
	}

	Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (btn) {
		btn.addEventListener('click', function () {
			var source = document.getElementById(btn.getAttribute('data-copy'));
			if (!source) return;
			var value = typeof source.value === 'string' ? source.value : source.textContent;
			copyText(value).then(function () {
				toast('已复制');
			}).catch(function () {
				toast('复制失败，请手动选择', 'error');
			});
		});
	});

	var subInput = document.getElementById('subUrl');
	var formatHint = document.getElementById('formatHint');
	var guestNote = document.getElementById('guestNote');
	var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-format]'));
	var modeButtons = Array.prototype.slice.call(document.querySelectorAll('[data-mode]'));
	var state = { format: 'auto', mode: 'owner', qrOpen: false, url: '' };

	function resolveUrl() {
		var tab = document.querySelector('[data-format="' + state.format + '"]');
		if (!tab) return '';
		return tab.getAttribute(state.mode === 'guest' ? 'data-guest' : 'data-owner') || '';
	}

	function syncUrl() {
		state.url = resolveUrl();
		if (subInput) subInput.value = state.url;
		var active = document.querySelector('[data-format="' + state.format + '"]');
		if (formatHint) formatHint.textContent = active ? (active.getAttribute('data-hint') || '') : '';
		if (guestNote) guestNote.hidden = state.mode !== 'guest';
		if (state.qrOpen) renderQR();
	}

	tabs.forEach(function (tab) {
		tab.addEventListener('click', function () {
			state.format = tab.getAttribute('data-format') || 'auto';
			tabs.forEach(function (item) {
				var active = item === tab;
				item.classList.toggle('is-active', active);
				item.setAttribute('aria-selected', active ? 'true' : 'false');
			});
			syncUrl();
		});
	});

	modeButtons.forEach(function (btn) {
		btn.addEventListener('click', function () {
			state.mode = btn.getAttribute('data-mode') === 'guest' ? 'guest' : 'owner';
			modeButtons.forEach(function (item) {
				var active = item === btn;
				item.classList.toggle('is-active', active);
				item.setAttribute('aria-selected', active ? 'true' : 'false');
			});
			syncUrl();
		});
	});

	var copyBtn = document.getElementById('copyBtn');
	if (copyBtn) {
		copyBtn.addEventListener('click', function () {
			var value = state.url || (subInput ? subInput.value : '');
			copyText(value).then(function () {
				toast('订阅地址已复制');
			}).catch(function () {
				toast('复制失败，请手动选择', 'error');
			});
		});
	}

	var qrBtn = document.getElementById('qrBtn');
	var qrPanel = document.getElementById('qrPanel');
	var qrBox = document.getElementById('qrcode');
	var qrNote = document.getElementById('qrNote');
	var qrLoading = false;
	var qrQueue = [];

	function flushQR(ok) {
		var queue = qrQueue.slice();
		qrQueue = [];
		queue.forEach(function (callback) { callback(ok); });
	}

	function ensureQR(callback) {
		if (window.QRCode) return callback(true);
		qrQueue.push(callback);
		if (qrLoading) return;
		qrLoading = true;
		var script = document.createElement('script');
		script.src = 'https://cdn.jsdelivr.net/npm/@keeex/qrcodejs-kx@1.0.2/qrcode.min.js';
		script.onload = function () { qrLoading = false; flushQR(true); };
		script.onerror = function () { qrLoading = false; flushQR(false); };
		document.head.appendChild(script);
	}

	function renderQR() {
		if (!qrBox) return;
		qrBox.textContent = '';
		if (qrNote) qrNote.textContent = '正在生成二维码…';
		ensureQR(function (ok) {
			if (!ok) {
				if (qrNote) qrNote.textContent = '二维码组件加载失败，请直接复制链接';
				return;
			}
			qrBox.textContent = '';
			try {
				new window.QRCode(qrBox, {
					text: state.url,
					width: 148,
					height: 148,
					colorDark: '#0b1220',
					colorLight: '#ffffff',
					correctLevel: window.QRCode.CorrectLevel.M
				});
				if (qrNote) qrNote.textContent = '二维码在本地生成，不会上传到服务器';
			} catch (e) {
				if (qrNote) qrNote.textContent = '链接过长，无法生成二维码，请直接复制链接';
			}
		});
	}

	if (qrBtn && qrPanel) {
		qrBtn.addEventListener('click', function () {
			state.qrOpen = !state.qrOpen;
			qrPanel.hidden = !state.qrOpen;
			qrBtn.setAttribute('aria-expanded', state.qrOpen ? 'true' : 'false');
			qrBtn.classList.toggle('is-active', state.qrOpen);
			if (state.qrOpen) renderQR();
		});
	}

	var textarea = document.getElementById('content');
	var saveBtn = document.getElementById('saveBtn');
	var saveStatus = document.getElementById('saveStatus');
	var saveStatusText = document.getElementById('saveStatusText');
	var statNodes = document.getElementById('statNodes');
	var statSubs = document.getElementById('statSubs');
	var statLines = document.getElementById('statLines');
	var protoList = document.getElementById('protoList');
	var lastSaved = textarea ? textarea.value : '';
	var dirty = false;
	var saving = false;
	var timer = null;

	function timeLabel() {
		try {
			return new Date().toLocaleTimeString('zh-CN', { hour12: false });
		} catch (e) {
			return '';
		}
	}

	function setSaveState(kind, text) {
		if (saveStatus) saveStatus.setAttribute('data-state', kind);
		if (saveStatusText) saveStatusText.textContent = text;
	}

	function normalize(value) {
		return value.replace(/^([a-zA-Z][a-zA-Z0-9+.-]*)：\\/\\//gm, '$1://');
	}

	function save(reason) {
		if (!textarea) return;
		var raw = textarea.value;
		var value = normalize(raw);
		if (value !== raw) {
			var position = textarea.selectionStart;
			textarea.value = value;
			try { textarea.setSelectionRange(position, position); } catch (e) {}
			dirty = true;
			updateStats();
		}
		if (value === lastSaved) {
			if (reason === 'manual') setSaveState('idle', '内容未变化');
			return;
		}
		if (saving) return;
		saving = true;
		if (saveBtn) {
			saveBtn.disabled = true;
			saveBtn.classList.add('is-busy');
		}
		setSaveState('busy', '保存中…');
		fetch(window.location.href, {
			method: 'POST',
			body: value,
			headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
			cache: 'no-cache',
			keepalive: reason === 'unload'
		}).then(function (response) {
			if (!response.ok) throw new Error('HTTP ' + response.status);
			lastSaved = value;
			if (textarea.value !== value) {
				// Edits arrived while the request was in flight; keep them dirty.
				dirty = true;
				setSaveState('dirty', '未保存');
				clearTimeout(timer);
				timer = setTimeout(function () { save('auto'); }, 1200);
				return;
			}
			dirty = false;
			setSaveState('ok', '已保存 · ' + timeLabel());
			if (saveBtn) {
				var label = saveBtn.querySelector('span');
				if (label) {
					label.textContent = '已保存';
					setTimeout(function () { label.textContent = '保存'; }, 1600);
				}
			}
		}).catch(function (error) {
			setSaveState('error', '保存失败：' + (error && error.message ? error.message : '网络错误'));
		}).then(function () {
			saving = false;
			if (saveBtn) {
				saveBtn.disabled = false;
				saveBtn.classList.remove('is-busy');
			}
		});
	}

	function analyze(value) {
		var lines = value.split(/\\r?\\n/);
		if (lines.length && lines[lines.length - 1] === '') lines.pop();
		var nodes = 0;
		var subs = 0;
		var protocols = {};
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i].trim();
			if (!line || line.charAt(0) === '#') continue;
			if (/^https?:\\/\\//i.test(line)) {
				subs++;
				continue;
			}
			var match = line.match(/^([a-z0-9+.-]+):\\/\\//i);
			if (match) {
				var name = match[1].toLowerCase();
				if (name === 'hy2') name = 'hysteria2';
				nodes++;
				protocols[name] = (protocols[name] || 0) + 1;
			}
		}
		return { nodes: nodes, subs: subs, lines: lines.length, protocols: protocols };
	}

	function renderProtocols(protocols) {
		if (!protoList) return;
		protoList.textContent = '';
		var entries = Object.keys(protocols).map(function (key) {
			return [key, protocols[key]];
		});
		entries.sort(function (a, b) { return b[1] - a[1]; });
		if (!entries.length) {
			var empty = document.createElement('p');
			empty.className = 'empty';
			empty.textContent = '暂无节点';
			protoList.appendChild(empty);
			return;
		}
		var max = entries[0][1] || 1;
		entries.slice(0, 6).forEach(function (entry) {
			var row = document.createElement('div');
			row.className = 'proto-row';
			var name = document.createElement('span');
			name.className = 'proto-name';
			name.textContent = entry[0];
			var track = document.createElement('span');
			track.className = 'proto-track';
			var bar = document.createElement('span');
			bar.className = 'proto-bar';
			bar.style.width = Math.max(6, Math.round(entry[1] / max * 100)) + '%';
			track.appendChild(bar);
			var count = document.createElement('span');
			count.className = 'proto-count';
			count.textContent = String(entry[1]);
			row.appendChild(name);
			row.appendChild(track);
			row.appendChild(count);
			protoList.appendChild(row);
		});
	}

	function updateStats() {
		if (!textarea) return;
		var info = analyze(textarea.value);
		if (statNodes) statNodes.textContent = String(info.nodes);
		if (statSubs) statSubs.textContent = String(info.subs);
		if (statLines) statLines.textContent = String(info.lines);
		renderProtocols(info.protocols);
	}

	if (textarea) {
		lastSaved = textarea.value;
		updateStats();
		setSaveState('idle', '自动保存已开启');

		textarea.addEventListener('input', function () {
			dirty = true;
			updateStats();
			setSaveState('dirty', '未保存');
			clearTimeout(timer);
			timer = setTimeout(function () { save('auto'); }, 5000);
		});

		textarea.addEventListener('blur', function () {
			clearTimeout(timer);
			save('blur');
		});

		if (saveBtn) {
			saveBtn.addEventListener('click', function () { save('manual'); });
		}

		document.addEventListener('keydown', function (event) {
			if ((event.metaKey || event.ctrlKey) && String(event.key).toLowerCase() === 's') {
				event.preventDefault();
				save('manual');
			}
		});

		window.addEventListener('beforeunload', function () {
			if (dirty) save('unload');
		});

		document.addEventListener('visibilitychange', function () {
			if (document.visibilityState === 'hidden' && dirty) save('unload');
		});
	}

	syncUrl();
})();
</script>
</body>
</html>`;

		return new Response(html, {
			headers: { "Content-Type": "text/html;charset=utf-8" }
		});
	} catch (error) {
		console.error('处理请求时发生错误:', error);
		return new Response("服务器错误: " + error.message, {
			status: 500,
			headers: { "Content-Type": "text/plain;charset=utf-8" }
		});
	}
}
