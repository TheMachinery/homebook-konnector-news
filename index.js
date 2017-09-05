const { cozyClient } = require('cozy-konnector-libs')
const request = require('request-promise'); 


const host = 'https://homebook-api.mymachinery.fr'
const loginUrl = `${host}/accessToken`;

const grant_type = 'client_credentials';
const client_id = 1;
const client_secret = 'Avyn2IXPP9LDQx0je8YFGtUFM0KzCwf3aZzJs1Lx';
const DOCTYPE_NEWS = 'com.homebook.news';

var apiToken;

const options = {
	method: 'POST',
	url: loginUrl,
	form: {
		grant_type: grant_type,
		client_id: client_id,
		client_secret: client_secret
	}
}

cozyClient.data.defineIndex(DOCTYPE_NEWS, ['_id'])
.then(index => cozyClient.data.query(index, {selector: {
  _id: {
    '$gt': null
  }
}}))


.then(news => {
	//console.log(news.length, 'nb news');
	news.map(item => {
		cozyClient.data.delete(DOCTYPE_NEWS, item)
	})


})
.then(() => {



	request(options, (err, res) => {
		if (err) {
			//console.log(err, 'error');
		}    	


		var body = JSON.parse(res.body);
		apiToken = body.access_token;
		if (!body.access_token || body.access_token == "") {
			return false
		}


		const optionsData = {
			method: 'GET',
			url: 'https://homebook-api.mymachinery.fr/news?page=1',
			auth: {
				bearer: apiToken
			}
		}
	    request(optionsData, (err, res) => {
	    	if (err) {
				//console.log(err, 'error');
			}    	


			var body = JSON.parse(res.body);
			var data = body.data;
			var meta = body.meta;
			data.map(item => {
				//console.log(item);
				cozyClient.data.create(DOCTYPE_NEWS, item)
			});
			return meta;
		})
		.then((res) => {
			var res = JSON.parse(res);
			var meta = res.meta;
			if ( meta.pagination.total_pages > 1) {
				for(var i=2;i<=meta.pagination.total_pages;i++) {

					const optionsData = {
						method: 'GET',
						url: 'https://homebook-api.mymachinery.fr/news?page=' + i,
						auth: {
							bearer: apiToken
						}
					}

					request(optionsData, (err, res) => {
				    	if (err) {
							//console.log(err, 'error');
						}    	
						var body = JSON.parse(res.body);
						var data = body.data;
						data.map(item => {
							//console.log(item);
							cozyClient.data.create(DOCTYPE_NEWS, item)
						});
					})
				}
			}
		});

	    


		cozyClient.data.defineIndex(DOCTYPE_NEWS, ['_id'])
			.then(index => cozyClient.data.query(index, {selector: {
			  _id: {
			    '$gt': null
			  }
			}}))
			.then(news => {
			    //console.log('all good :) !')
			})
	});


});
