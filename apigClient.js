const uritemplate = require('uri-template').parse;
const utils = require('./lib/apiGatewayCore/utils');
const apiGatewayClientFactory = require('./lib/apiGatewayCore/apiGatewayClient');

function checkForCredentials(authType, uri) {
	if (authType === 'NONE') {
		if (uri.indexOf('/login') === 0 ||
			uri.indexOf('/access') === 0 ||
			uri.indexOf('/invitation') === 0 ||
			uri.indexOf('/resetpassword') === 0 ||
			uri.indexOf('/organisation') === 0) {
			return;
		}

		var returnedError = {
			response: {
				data: {
					status: 401,
					message: "Access Denied. Can't call " + uri + " with authentication type NONE"
				}
			}
		};
		throw returnedError;
	}
}
const apigClient = {};

apigClient.newClient = function(config) {
	console.log("NEW CLIENT")
	console.dir(config);
	var apigClient = {};

	if (config === undefined) {
		config = {
			accessKey: '',
			secretKey: '',
			sessionToken: '',
			region: '',
			invokeUrl: '',
			maxRetries: 1,
			apiKey: undefined,
			defaultContentType: 'application/json',
			defaultAcceptType: 'application/json'
		};
	}

	if (config.accessKey === undefined) {
		config.accessKey = '';
	}
	if (config.secretKey === undefined) {
		config.secretKey = '';
	}
	if (config.apiKey === undefined) {
		config.apiKey = '';
	}
	if (config.sessionToken === undefined) {
		config.sessionToken = '';
	}
	if (config.region === undefined) {
		config.region = 'us-east-1';
	}
	if (config.invokeUrl === undefined) {
		config.invokeUrl = '';
	}
	//If defaultContentType is not defined then default to application/json
	if (config.defaultContentType === undefined) {
		config.defaultContentType = 'application/json';
	}
	//If defaultAcceptType is not defined then default to application/json
	if (config.defaultAcceptType === undefined) {
		config.defaultAcceptType = 'application/json';
	}

	// extract endpoint and path from url
	var invokeUrl = config.invokeUrl;
	var endpoint = /(^https?:\/\/[^\/]+)/g.exec(invokeUrl)[1];
	var pathComponent = invokeUrl.substring(endpoint.length);

	var sigV4ClientConfig = {
		accessKey: config.accessKey,
		secretKey: config.secretKey,
		sessionToken: config.sessionToken,
		serviceName: 'execute-api',
		region: config.region,
		endpoint: endpoint,
		defaultContentType: config.defaultContentType,
		defaultAcceptType: config.defaultAcceptType
	};

	console.log("sigV4ClientConfig START");
	console.dir(sigV4ClientConfig);
	console.log("sigV4ClientConfig END");

	var authType = 'NONE';
	if (sigV4ClientConfig.accessKey !== undefined && sigV4ClientConfig.accessKey !== '' && sigV4ClientConfig.secretKey !== undefined && sigV4ClientConfig.secretKey !== '') {
		authType = 'AWS_IAM';
	}

	var simpleHttpClientConfig = {
		endpoint: endpoint,
		defaultContentType: config.defaultContentType,
		defaultAcceptType: config.defaultAcceptType
	};

	

	var apiGatewayClient = apiGatewayClientFactory.newClient(simpleHttpClientConfig, sigV4ClientConfig);

	apigClient.getObjectPropertyNames = function (obj) {
		var paramNames = [];
		for (var property in obj) {
			if (obj.hasOwnProperty(property)) {
				paramNames.push(property);
			}
		}

		return paramNames;
	};

	apigClient.post = function (uri, body) {
		checkForCredentials(authType, uri);

		var params = {};
		var additionalParams = {
			headers: {
				"Origin": "http://capango.dynomite.io"
			}
		};

		utils.assertParametersDefined(params, [], ['body']);

		var getRequestpostRequest = {
			verb: 'POST',
			path: pathComponent + uritemplate(uri).expand(utils.parseParametersToObject(params, [])),
			headers: utils.parseParametersToObject(params, []),
			queryParams: utils.parseParametersToObject(params, []),
			body: body
		};

		return apiGatewayClient.makeRequest(getRequestpostRequest, authType, additionalParams, config.apiKey);
	};

	apigClient.get = function (uri, params, query) {
		checkForCredentials(authType, uri);

		var body = {};
		var additionalParams = {};
		var paramNames = this.getObjectPropertyNames(params);
		var queryNames = this.getObjectPropertyNames(query);

		utils.assertParametersDefined(params, paramNames, ['body']);

		var getRequest = {
			verb: 'GET',
			path: pathComponent + uritemplate(uri).expand(utils.parseParametersToObject(params, paramNames)),
			headers: utils.parseParametersToObject(params, []),
			queryParams: utils.parseParametersToObject(query, queryNames),
			body: body
		};


		return apiGatewayClient.makeRequest(getRequest, authType, additionalParams, config.apiKey);
	};

	apigClient.delete = function (uri, params, query, body) {
		checkForCredentials(authType, uri);

		var thebody = body ? body : {
			dummy: "dummy param"
		};

		var additionalParams = {};
		var paramNames = this.getObjectPropertyNames(params);
		var queryNames = this.getObjectPropertyNames(query);

		utils.assertParametersDefined(params, paramNames, ['body']);

		var deleteRequest = {
			verb: 'DELETE',
			path: pathComponent + uritemplate(uri).expand(utils.parseParametersToObject(params, paramNames)),
			headers: utils.parseParametersToObject(params, []),
			queryParams: utils.parseParametersToObject(query, queryNames),
			body: thebody
		};

		return apiGatewayClient.makeRequest(deleteRequest, authType, additionalParams, config.apiKey);
	};

	return apigClient;
};

module.exports = apigClient;
