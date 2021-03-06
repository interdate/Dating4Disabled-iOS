
    var IAP = {
        list: [ 'OneMon', 'ThreeMon', 'SixMon', 'OneY'],
        products: {}
    };
    var localStorage = window.localStorage || {};

    IAP.initialize = function () {
        // Check availability of the storekit plugin
        if (!window.storekit) {
            console.log('In-App Purchases not available');
            return;
        }
		
		
		//app.startLoading();

        // Initialize
        storekit.init({
            debug:    true,
            ready:    IAP.onReady,
            purchase: IAP.onPurchase,
            restore:  IAP.onRestore,
            error:    IAP.onError
        });
    };

    IAP.onReady = function () {
        // Once setup is done, load all product data.
        storekit.load(IAP.list, function (products, invalidIds) {
            console.log('IAPs loading done:');
            for (var j = 0; j < products.length; ++j) {
                var p = products[j];
                console.log('Loaded IAP(' + j + '). title:' + p.title +
                            ' description:' + p.description +
                            ' price:' + p.price +
                            ' id:' + p.id);
                IAP.products[p.id] = p;
            }
            IAP.loaded = true;
            for (var i = 0; i < invalidIds.length; ++i) {
                console.log('Error: could not load ' + invalidIds[i]);
            }
            IAP.render();
        });
    };

	IAP.render = function () {
		if (IAP.loaded) {
			
			console.log(IAP.list);
			console.log(IAP.products);
			
			var template = $('#subscrItemTemplate').html();
			
			for (var id in IAP.products) {
				var currentTemplate = template;
				var product = IAP.products[id];
				currentTemplate = currentTemplate.replace("[TITLE]",product.title);
				currentTemplate = currentTemplate.replace("[PRICE]",product.price);
				currentTemplate = currentTemplate.replace("[PURCHASE_ID]",product.id);
				
			}
			
			
			$('#subscrList').html(currentTemplate);
			
			app.stopLoading();
			
			//alert($('#subscrList').html());
			
		}
		else {
			app.alert("In-App Purchases not available");
		}
	};




    IAP.onPurchase = function (transactionId, productId) {
		
		if(transactionId > 0){
		
		switch(productId){
			case 'OneMon':
				var monthsNumber = 1;
				break;
				
			case 'ThreeMon':
				var monthsNumber = 3;
				break;
				
			case 'SixMon':
				var monthsNumber = 6;
				break;
				
			case 'OneY':
				var monthsNumber = 12;
				break;
		}
		
		
		
		$.ajax({
			url: 'http://m.dating4disabled.com/api/v2/user/subscription/monthsNumber:'+monthsNumber,
			type: 'Post',
			success: function(data, status){
			   //alert(JSON.stringify(data));
			   
			   app.alert('Congratulations on your purchase of a paid subscription to Dating4Disabled.com');
			   app.chooseMainPage();
			   
			   /*
			   if(data.result == true){
					alert('Congratulations on your purchase of a paid subscription to Dating4Disabled.com');
			   }
				*/
			}
		});
        
			
		}
		/*
		var n = (localStorage['storekit.' + productId]|0) + 1;
        localStorage['storekit.' + productId] = n;
        if (IAP.purchaseCallback) {
            IAP.purchaseCallback(productId);
            delete IAP.purchaseCallbackl;
        }
		 */
    };


    IAP.onError = function (errorCode, errorMessage) {
        app.alert('Error: ' + errorMessage);
    };

    IAP.onRestore = function (transactionId, productId) {
        console.log("Restored: " + productId);
        var n = (localStorage['storekit.' + productId]|0) + 1;
        localStorage['storekit.' + productId] = n;
    };

    IAP.buy = function (productId, callback) {
        IAP.purchaseCallback = callback;
        storekit.purchase(productId);
    };

    IAP.restore = function () {
        storekit.restore();
    };

    IAP.fullVersion = function () {
        return localStorage['storekit.OneMon'];
    };
