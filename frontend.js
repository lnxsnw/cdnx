const serviceaccounts = [
  // Insert Service Accounts here. Include the brackets too!
,
];
const randomserviceaccount = serviceaccounts[Math.floor(Math.random()*serviceaccounts.length)];
const authConfig = {
  "siteName": "XXXX", // Website name
  "client_id": "", // Client id from Google Cloud Console
  "client_secret": "", // Client Secret from Google Cloud Console
  "refresh_token": "", // Authorize token
  "service_account": true, // idk if this has effects, dont touch for safety
  "service_account_json": randomserviceaccount, // don't touch this one
  "files_list_page_size": 50, // idk if this has effects anymore
  "search_result_list_page_size": 50, // idk if this has effects anymore
  "enable_cors_file_down": true, // idk if this has effects anymore
  "enable_password_file_verify": true, // support for .password file, idk if this has effects anymore
  "repository" : "XXXX", // The github repository where the backend.js file is stored
  "theme" : "material", // material OR classic, idk if this has effects anymore
  "root": "XXXX" // "root" or ROOT_FOLDER or TD
};

var gd;

var html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex, nofollow">
  <meta name="viewport" content="width=device-width, initial-scale=1.0,maximum-scale=1.0, user-scalable=no"/>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🗂️</text></svg>">
  <title>${authConfig.siteName}</title>
  <script src="//cdn.jsdelivr.net/combine/gh/jquery/jquery/dist/jquery.min.js,gh/${authConfig.repository}@latest/backend.js"></script>
  <style> .mdui-typo h1, .mdui-typo h2, .mdui-typo h3, .mdui-typo h4, .mdui-typo h5, .mdui-typo h6 {color: #00dffc !important;}body {color: #fff;background-color: #212121 !important;}.mdui-theme-primary-blue-grey .mdui-color-theme {background-color: #000000 !important;}.mdui-list {background-color: #303030 !important;}.mdui-text-right {text-align: center !important;}.material-icons {style\=\"padding-right\:\ 8px\;padding-left\:\ 8px\;\": !important;padding-right: 8px !important;padding-left: 8px !important;}@media (min-width: 600px) {.mdui-col-sm-7 {width: 58.333333% !important;}}.mdui-list > .th {background-color: #424242 !important;}div.mdui-row:nth-child(2) > ul:nth-child(1) {padding-top: 0px !important;padding-bottom: 0px !important;}li.mdui-ripple:nth-child(1) > a:nth-child(1) > div:nth-child(1) > i:nth-child(1) {padding-right: 8px !important;padding-left: 8px !important;}li.mdui-list-item:nth-child(2) > a:nth-child(1) > div:nth-child(1) > i:nth-child(1) {padding-left: 8px !important;}div.mdui-row:nth-child(2) > ul:nth-child(1) {padding-top: 0px !important;padding-bottom: 0px !important;}.th > div:nth-child(1) {padding-left: 50px !important;}#head_md {padding-top: 0px !important;padding-bottom: 0px !important;}#head_md > h1:nth-child(1) {margin-top: 18px !important;}#readme_md > h1:nth-child(1) {margin-top: 18px !important;}.mdui-theme-primary-blue-grey .mdui-progress-determinate, .mdui-theme-primary-blue-grey .mdui-progress-indeterminate {background-color:#00dffc !important;} .mdui-typo hr {height:10px;margin-bottom:.8em;border:none;border-bottom:1px solid rgba(255, 255, 255, 0.5);}</style>
</head>
<body>
</body>
</html>
`;

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

/**
 * Fetch and log a request
 * @param {Request} request
 */
async function handleRequest(request) {
    if(gd == undefined){
      gd = new googleDrive(authConfig);
    }

    if(request.method == 'POST'){
      return apiRequest(request);
    }

    let url = new URL(request.url);
    let path = url.pathname;
    let action = url.searchParams.get('a');

    if(path.substr(-1) == '/' || action != null){
      return new Response(html,{status:200,headers:{'Content-Type':'text/html; charset=utf-8'}});
    }else{
      if(path.split('/').pop().toLowerCase() == ".password"){
        return new Response("",{status:404});
      }
      let file = await gd.file(path);
      let range = request.headers.get('Range');
      return gd.down(file.id, range);
    }
}


async function apiRequest(request) {
    let url = new URL(request.url);
    let path = url.pathname;

    let option = {status:200,headers:{'Access-Control-Allow-Origin':'*'}}

    if(path.substr(-1) == '/'){
      // check password
      let password = await gd.password(path);
      ////console.log("dir password", password);
      if(password != undefined && password != null && password != ""){
        try{
          var obj = await request.json();
        }catch(e){
          var obj = {};
        }
        ////console.log(password,obj);
        if(password.replace("\n", "") != obj.password){
          let html = `{"error": {"code": 401,"message": "password error."}}`;
          return new Response(html,option);
        }
      }
      let list = await gd.list(path);
      return new Response(JSON.stringify(list),option);
    }else{
      let file = await gd.file(path);
      let range = request.headers.get('Range');
      return new Response(JSON.stringify(file));
    }
}

const JSONWebToken = {
    header: {
        alg: 'RS256',
        typ: 'JWT'
    },
    importKey: async function(pemKey) {
        var pemDER = this.textUtils.base64ToArrayBuffer(pemKey.split('\n').map(s => s.trim()).filter(l => l.length && !l.startsWith('---')).join(''));
        return crypto.subtle.importKey('pkcs8', pemDER, {
            name: 'RSASSA-PKCS1-v1_5',
            hash: 'SHA-256'
        }, false, ['sign']);
    },
    createSignature: async function(text, key) {
        const textBuffer = this.textUtils.stringToArrayBuffer(text);
        return crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, textBuffer)
    },
    generateGCPToken: async function(serviceAccount) {
        const iat = parseInt(Date.now() / 1000);
        var payload = {
            "iss": serviceAccount.client_email,
            "scope": "https://www.googleapis.com/auth/drive",
            "aud": "https://oauth2.googleapis.com/token",
            "exp": iat + 3600,
            "iat": iat
        };
        const encPayload = btoa(JSON.stringify(payload));
        const encHeader = btoa(JSON.stringify(this.header));
        var key = await this.importKey(serviceAccount.private_key);
        var signed = await this.createSignature(encHeader + "." + encPayload, key);
        return encHeader + "." + encPayload + "." + this.textUtils.arrayBufferToBase64(signed).replace(/\//g, '_').replace(/\+/g, '-');
    },
    textUtils: {
        base64ToArrayBuffer: function(base64) {
            var binary_string = atob(base64);
            var len = binary_string.length;
            var bytes = new Uint8Array(len);
            for (var i = 0; i < len; i++) {
                bytes[i] = binary_string.charCodeAt(i);
            }
            return bytes.buffer;
        },
        stringToArrayBuffer: function(str) {
            var len = str.length;
            var bytes = new Uint8Array(len);
            for (var i = 0; i < len; i++) {
                bytes[i] = str.charCodeAt(i);
            }
            return bytes.buffer;
        },
        arrayBufferToBase64: function(buffer) {
            let binary = '';
            let bytes = new Uint8Array(buffer);
            let len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        }
    }
};

class googleDrive {
    constructor(authConfig) {
        this.authConfig = authConfig;
        this.paths = [];
        this.files = [];
        this.passwords = [];
        this.paths["/"] = authConfig.root;
        if(authConfig.root_pass != ""){
            this.passwords["/"] = authConfig.root_pass;
        }
        this.accessToken();
    }

    async down(id, range=''){
      let url = `https://www.googleapis.com/drive/v3/files/${id}?alt=media`;
      let requestOption = await this.requestOption();
      requestOption.headers['Range'] = range;
      return await fetch(url, requestOption);
    }

    async file(path){
      if(typeof this.files[path] == 'undefined'){
        this.files[path]  = await this._file(path);
      }
      return this.files[path] ;
    }

    async _file(path){
      let arr = path.split('/');
      let name = arr.pop();
      name = decodeURIComponent(name).replace(/\'/g, "\\'");
      let dir = arr.join('/')+'/';
      ////console.log(name, dir);
      let parent = await this.findPathId(dir);
      ////console.log(parent);
      let url = 'https://www.googleapis.com/drive/v3/files';
      let params = {'includeItemsFromAllDrives':true,'supportsAllDrives':true};
      params.q = `'${parent}' in parents and name = '${name}' andtrashed = false`;
      params.fields = "files(id, name, mimeType, size ,createdTime, modifiedTime, iconLink, thumbnailLink)";
      url += '?'+this.enQuery(params);
      let requestOption = await this.requestOption();
      let response = await fetch(url, requestOption);
      let obj = await response.json();
      //console.log(obj);
      return obj.files[0];
    }

    // Request Cache
    async list(path){
      if (gd.cache == undefined) {
        gd.cache = {};
      }

      if (gd.cache[path]) {
        return gd.cache[path];
      }

      let id = await this.findPathId(path);
      var obj = await this._ls(id);
      if (obj.files && obj.files.length > 1000) {
            gd.cache[path] = obj;
      }

      return obj
    }

    async password(path){
      if(this.passwords[path] !== undefined){
        return this.passwords[path];
      }

      //console.log("load",path,".password",this.passwords[path]);

      let file = await gd.file(path+'.password');
      if(file == undefined){
        this.passwords[path] = null;
      }else{
        let url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
        let requestOption = await this.requestOption();
        let response = await this.fetch200(url, requestOption);
        this.passwords[path] = await response.text();
      }

      return this.passwords[path];
    }

    async _ls(parent){
      //console.log("_ls",parent);

      if(parent==undefined){
        return null;
      }
      const files = [];
      let pageToken;
      let obj;
      let params = {'includeItemsFromAllDrives':true,'supportsAllDrives':true};
      params.q = `'${parent}' in parents and trashed = false AND name !='.password'`;
      params.orderBy= 'folder,name,modifiedTime desc';
      params.fields = "nextPageToken, files(id, name, mimeType, size , modifiedTime)";
      params.pageSize = 1000;

      do {
        if (pageToken) {
            params.pageToken = pageToken;
        }
        let url = 'https://www.googleapis.com/drive/v3/files';
        url += '?'+this.enQuery(params);
        let requestOption = await this.requestOption();
        let response = await fetch(url, requestOption);
        obj = await response.json();
        files.push(...obj.files);
        pageToken = obj.nextPageToken;
      } while (pageToken);

      obj.files = files;
      return obj;
    }

    async findPathId(path){
      let c_path = '/';
      let c_id = this.paths[c_path];

      let arr = path.trim('/').split('/');
      for(let name of arr){
        c_path += name+'/';

        if(typeof this.paths[c_path] == 'undefined'){
          let id = await this._findDirId(c_id, name);
          this.paths[c_path] = id;
        }

        c_id = this.paths[c_path];
        if(c_id == undefined || c_id == null){
          break;
        }
      }
      //console.log(this.paths);
      return this.paths[path];
    }

    async _findDirId(parent, name){
      name = decodeURIComponent(name).replace(/\'/g, "\\'");
      
      //console.log("_findDirId",parent,name);

      if(parent==undefined){
        return null;
      }

      let url = 'https://www.googleapis.com/drive/v3/files';
      let params = {'includeItemsFromAllDrives':true,'supportsAllDrives':true};
      params.q = `'${parent}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${name}'  and trashed = false`;
      params.fields = "nextPageToken, files(id, name, mimeType)";
      url += '?'+this.enQuery(params);
      let requestOption = await this.requestOption();
      let response = await fetch(url, requestOption);
      let obj = await response.json();
      if(obj.files[0] == undefined){
        return null;
      }
      return obj.files[0].id;
    }

    async accessToken(){
      //console.log("accessToken");
      if(this.authConfig.expires == undefined  ||this.authConfig.expires< Date.now()){
        const obj = await this.fetchAccessToken();
        if(obj.access_token != undefined){
          this.authConfig.accessToken = obj.access_token;
          this.authConfig.expires = Date.now()+3500*1000;
        }
      }
      return this.authConfig.accessToken;
    }

    async fetchAccessToken() {
        //console.log("fetchAccessToken");
        const url = "https://www.googleapis.com/oauth2/v4/token";
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        var post_data;
        if (this.authConfig.service_account && typeof this.authConfig.service_account_json != "undefined") {
            const jwttoken = await JSONWebToken.generateGCPToken(this.authConfig.service_account_json);
            post_data = {
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwttoken,
            };
        } else {
            post_data = {
                client_id: this.authConfig.client_id,
                client_secret: this.authConfig.client_secret,
                refresh_token: this.authConfig.refresh_token,
                grant_type: "refresh_token",
            };
        }

        let requestOption = {
            'method': 'POST',
            'headers': headers,
            'body': this.enQuery(post_data)
        };

        const response = await fetch(url, requestOption);
        return await response.json();
    }

    async fetch200(url, requestOption) {
        let response;
        for (let i = 0; i < 3; i++) {
            response = await fetch(url, requestOption);
            //console.log(response.status);
            if (response.status != 403) {
                break;
            }
            await this.sleep(800 * (i + 1));
        }
        return response;
    }

    async requestOption(headers={},method='GET'){
      const accessToken = await this.accessToken();
      headers['authorization'] = 'Bearer '+ accessToken;
      return {'method': method, 'headers':headers};
    }

    enQuery(data) {
        const ret = [];
        for (let d in data) {
            ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
        }
        return ret.join('&');
    }

    sleep(ms) {
        return new Promise(function (resolve, reject) {
            let i = 0;
            setTimeout(function () {
                //console.log('sleep' + ms);
                i++;
                if (i >= 2) reject(new Error('i>=2'));
                else resolve(i);
            }, ms);
        })
    }
}

String.prototype.trim = function (char) {
    if (char) {
        return this.replace(new RegExp('^\\'+char+'+|\\'+char+'+$', 'g'), '');
    }
    return this.replace(/^\s+|\s+$/g, '');
};
