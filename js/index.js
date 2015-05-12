



window.onerror = function(message, url, lineNumber) {
	//console.log("Error: "+message+" in "+url+" at line "+lineNumber);
	alert("Error: "+message+" in "+url+" at line "+lineNumber);
	
}



pagesTracker = [];
pagesTracker.push('main_page');
var pushNotification;


var app = { 
		
	/*
	data: {
		pictureSource : '',
		destinationType : '',
		encodingType : '',
	},
	*/
		
		
	pictureSource : '',
	destinationType : '',
	encodingType : '',	
	currentPageId : '',
	currentPageWrapper : '',
	recentScrollPos : '',
	
	action : '',
	requestUrl : '',
	requestMethod : '',
	response : '',
	responseItemsNumber : '',
	pageNumber : '',
	itemsPerPage : 30,
	container : '',
	usersContainer : '',
	template : '',
	userTemplate : '',
	statAction : '',
	searchFuncsMainCall: '',
	sort: '',
	firstBadgeUsersResults : true,
	
	
	profileGroupTemplate : '',
	profileLineTemplate : '',
	
	userId : '',
	reportAbuseUserId : '',
	gcmDeviceId : '',
	imageId : '',
	positionSaved : false,
	logged: false,
	newMessagesCount : 0,
	
	EULA: false,
	
	init: function(){
		
		app.ajaxSetup();
		app.pictureSource = navigator.camera.PictureSourceType;
		app.destinationType = navigator.camera.DestinationType;
		app.encodingType = navigator.camera.EncodingType;
		
		if(window.localStorage.getItem('EULA') == "accepted"){
			app.EULA = true;
		}
				
		app.chooseMainPage();
	},

	ajaxSetup: function(){
		app.stopLoading();
		$.ajaxSetup({			
			dataType: 'json',
			type: 'Get',
			timeout: 50000,
			beforeSend: function(xhr){
				var user = window.localStorage.getItem("user");
				var pass = window.localStorage.getItem("pass");
					
				if( (user == '' && pass == '') || (user === null && pass === null) ){
					var user = 'nouser';
					var pass = 'nopass';
				}
				xhr.setRequestHeader ("Authorization", "Basic " + btoa ( user + ":" + pass) );
			},		
			statusCode:{
				403: function(response, textStatus, xhr){
					app.stopLoading();
					app.showPage('login_page');
					app.alert('You entered incorrect data, please try again');
				}
			},
			
			error: function(response, textStatus, errorThrown){
				app.stopLoading();				
				//alert(response.status + ':' + errorThrown );
				console.log(textStatus);
			},
			
			complete: function(response, status, jqXHR){
				app.stopLoading();
			},
		});		
	},
	
	alert: function(message){
		navigator.notification.alert(
			message,
			function(){},
			'Notification',
			'Ok'
		);
	},
	
	logout:function(){
		
		app.startLoading();
		clearTimeout(newMesssages);
		pagesTracker = [];
		pagesTracker.push('login_page');
		
		$.ajax({				
			url: 'http://m.dating4disabled.com/api/v2/user/logout',			
			success: function(data, status){
				//alert(JSON.stringify(data));
				if(data.logout == 1){					
					app.logged = false;					
					app.positionSaved = false;
					window.localStorage.setItem("userId", "");
					window.localStorage.setItem("user", "");
					window.localStorage.setItem("pass", "");
					app.UIHandler();
					app.ajaxSetup();
					app.stopLoading();
				}				
			}
		});
	},
	
	UIHandler: function(){
		
		document.removeEventListener("backbutton", app.back, false);
		
		if(app.logged === false){
			var userInput = window.localStorage.getItem("userInput");			 
			$('#user_input').find('input').val(userInput);
			$('.appPage').hide();
			$('.new_mes').hide(); 
			$("#login_page").show();  
			$('#back').hide();
			$('#logout').hide();
			$('#contact').hide();
			$('#sign_up').show();
			//app.printUsers();
			app.currentPageId = 'login_page';
			app.currentPageWrapper = $('#'+app.currentPageId);
		}
		else{
			$('.appPage').hide();
			$("#main_page").show();					
			$('#back').hide();
			$('#logout').show();
			$('#sign_up').hide();
			//$('#contact').show();								 
			app.currentPageId = 'main_page';
			app.currentPageWrapper = $('#'+app.currentPageId);
			
		}
	},
	
	loggedUserInit: function(){
		app.searchFuncsMainCall = true;
		app.firstBadgeUsersResults = true;
		app.setBannerDestination();		
		app.checkNewMessages();					
		app.pushNotificationInit();
		app.sendUserPosition();
	},
	
	
	startLoading: function(){
		
		//$('.spinner-wrapper').css({"height":app.container.height()});
		$('.loading').show();
		//alert('start');
	},
	
	stopLoading: function(){
		
		$('.loading').hide();
		//alert('stop');
	},
	
	chooseMainPage: function(){
		app.startLoading();
		pagesTracker = [];
		pagesTracker.push('main_page');
		
		$(".new_mes").hide();
		$("#new_mes_count").hide();
		
		if(app.EULA === false){
			app.showPage('EULA_page');
			$('#back').hide();
			app.stopLoading();
			return;
		}
		
		$.ajax({ 
			url: 'http://m.dating4disabled.com/api/v2/user/login',
			error: function(response, text){
				console.log(text);
			},
			statusCode:{
				403: function(response, status, xhr){
					app.logged = false;
					app.UIHandler();
				}
			},
			success: function(data, status){
			   console.log(data);
				if(data.userId > 0){					
					app.logged = true;
					window.localStorage.setItem("userId", data.userId);					
					app.UIHandler();
					app.loggedUserInit();
					$(window).unbind("scroll");
					window.scrollTo(0, 0);
				}		
			}
		});		
	},
	
	
	acceptEULA: function(accept){
		
		if(accept === true){
			window.localStorage.setItem("EULA", "accepted");
			app.EULA = true;
			app.chooseMainPage();
		}
	},
	
	
	
	setBannerDestination: function(){
		$.ajax({				
			url: 'http://m.dating4disabled.com/api/v2/user/banner',			
			success: function(response, status){
				app.response = response;
				//alert(JSON.stringify(app.response));   
				$('#bannerLink').attr("onclick",app.response.banner.func);				
				$('#bannerLink').find("img").attr("src",app.response.banner.src);
			}
		});
	},
	
	sendAuthData: function(){
		
		var user = $("#authForm .email").val(); 
		var pass = $("#authForm .password").val();
		
		window.localStorage.setItem("user",user);
		window.localStorage.setItem("pass",pass);	
		
		$.ajax({				
			url: 'http://m.dating4disabled.com/api/v2/user/login',
			beforeSend: function(xhr){
				user = window.localStorage.getItem("user");
				pass = window.localStorage.getItem("pass");				
				xhr.setRequestHeader ("Authorization", "Basic " + btoa ( user + ":" + pass) );
			},
			success: function(data, status){				
				if(data.userId > 0){
					
			   app.logged = true;
					app.ajaxSetup();
					app.showPage('main_page');
					$('#logout').show();
					$(".new_mes").hide();
					window.localStorage.setItem("userId", data.userId);
					window.localStorage.setItem("userInput", user);
					$("#authForm .password").val("");
					//app.UIHandler();
					app.loggedUserInit();
				}				
			}
		});
	},
	
	sendUserPosition: function(){
		
		//setTimeout(function(){
			if(app.positionSaved === false){
			//alert(0);
				navigator.geolocation.getCurrentPosition(app.persistUserPosition, app.userPositionError, {
					enableHighAccuracy: true,
				});

			}
		
		//}, 15000);
	},	
	
	persistUserPosition: function(position){
		var data = {
			longitude: position.coords.longitude,
			latitude: position.coords.latitude
		};
		//alert(JSON.stringify(data));
		//return;
		$.ajax({
			url: 'http://m.dating4disabled.com/api/v2/user/location',
			type: 'Post',
			data:JSON.stringify(data),
			success: function(response){
				app.response = response; 
				
			   app.positionSaved = app.response.result;
			   
				//alert(app.positionSaved);
			}
		});
	},
	
	userPositionError: function(error){
		//alert('code: '    + error.code    + '\n' +
	          //'message: ' + error.message + '\n');
	},

	
	printUsers: function(){
		$.ajax({
			url: 'http://m.dating4disabled.com/api/v2/users/recently_visited/2',
			success: function(data, status){
				for ( var i = 0; i < data.users.length; i++) {
					$("#udp_"+i).find(".user_photo_wrap .user_photo").attr("src",data.users[i].mainImage);
					$("#udp_"+i).find("span").text(data.users[i].nickName);
					$("#udp_"+i).find(".address").text(data.users[i].city);
				}				
				$(".user_data_preview").show();
			}
		});
	},
	
	contact: function(){		
		window.location.href = 'http://dating4disabled.com/contact.asp';		
	},	
	
	pushNotificationInit: function(){
		
		try{
        	pushNotification = window.plugins.pushNotification;
			pushNotification.register(app.tokenHandler, app.errorHandler, {"badge":"true", "sound":"true", "alert":"true", "ecb":"app.onNotificationAPN"});
        }
		catch(err){ 
			txt="There was an error on this page.\n\n"; 
			txt+="Error description: " + err.message + "\n\n"; 
			alert(txt); 
		} 
		
	},
	   
    persistApnDeviceId: function(){
    	//alert(app.apnDeviceId);
		$.ajax({
			url: 'http://m.dating4disabled.com/api/v2/user/deviceId/OS:iOS',
			type: 'Post',
			data: JSON.stringify({			
				deviceId: app.apnDeviceId
			}),
			success: function(data, status){				
				//alert(data.error);
			   //alert(data.persisting);
			}
		});
    },
    
    tokenHandler: function(result) {
        console.log('success:'+ result);
		app.apnDeviceId = result;
		app.persistApnDeviceId();
        // Your iOS push server needs to know the token before it can push to this device
        // here is where you might want to send it the token for later use.
    },
	
	onNotificationAPN: function(event) {
		if (event.alert) {
			//navigator.notification.alert(event.alert);
			app.checkNewMessages();
			
			if(app.currentPageId != 'chat_page'){
			
				navigator.notification.confirm(
				  'You got a new message',  // message
				  app.pushNotificationChoice,              // callback to invoke with index of button pressed
				  'Notification',            // title
				  'Messenger,Later'          // buttonLabels
				);
			}
		}
	
		if (event.sound) {
			var snd = new Media(event.sound);
			snd.play();
		}
	
		if (event.badge) {
			//navigator.notification.alert('test');
			pushNotification.setApplicationIconBadgeNumber(app.successHandler, app.errorHandler, event.badge);
		}
	},
	
	errorHandler: function (error) {
		//alert('error:'+ error);
		console.log('ERROR:'+ error);
		
	},
	
    successHandler: function (result) {
    	//alert('success:'+ result);
    },
	
	pushNotificationChoice: function(buttonPressedIndex){
		if(buttonPressedIndex == 1){
			app.getMessenger();
			
		}
	},
    
	
	back: function(){
		
		app.startLoading();
		$(window).unbind("scroll");
		window.scrollTo(0, 0);
			
		pagesTracker.splice(pagesTracker.length-1,1);
		var prevPage = pagesTracker[pagesTracker.length-1];		
		//alert(prevPage); 
		
		if(typeof prevPage == "undefined" || prevPage == "main_page" || prevPage == "login_page")
			//app.showPage('main_page');
			app.chooseMainPage();
		else
			app.showPage(prevPage);
		
		if(app.currentPageId == 'users_list_page'){
			app.template = $('#userDataTemplate').html();
			window.scrollTo(0, app.recentScrollPos);
			app.setScrollEventHandler();
		}
		
		app.searchFuncsMainCall = true;
		app.firstBadgeUsersResults = true;
		app.stopLoading();
	},
	
	showPage: function(page){		
		app.currentPageId = page;
		app.currentPageWrapper = $('#'+app.currentPageId);
		app.container = app.currentPageWrapper.find('.content_wrap');
		
		if(pagesTracker.indexOf(app.currentPageId) != -1){			
			pagesTracker.splice(pagesTracker.length-1,pagesTracker.indexOf(app.currentPageId));		
		}
		
		if(pagesTracker.indexOf(app.currentPageId) == -1){
			pagesTracker.push(app.currentPageId);
		}		
		
		$('.appPage').hide();
		app.currentPageWrapper.show();
		document.addEventListener("backbutton", app.back, false);
		
		if(app.currentPageId == 'main_page'){
			$('#back').hide();
			$('#sign_up').hide();
			
			//$('#contact').show();
		}
		else if(app.currentPageId == 'login_page'){
			$('#back').hide();
			$('#sign_up').show();			 
		}		
		else{
			$('#back').show();
			$('#sign_up').hide();
			
			//alert(app.newMessagesCount);
			
			if(app.newMessagesCount > 0 && app.currentPageId != 'register_page'){
				$('.new_mes_count2').html(app.newMessagesCount);
				$(".new_mes").show();
			}
		}
		
		$(window).unbind("scroll");
		
	},
	
	
	sortByDistance: function(){		
		app.sort = 'distance';		
		app.chooseSearchFunction();		
	},
	
	sortByEntranceTime: function(){
		app.sort = '';
		app.chooseSearchFunction();		
	},
	
	sortButtonsHandle: function(){
		if(app.sort == ''){
			$('#sortByEntranceTime').hide();
			$('#sortByDistance').show();
		}
		else{
			$('#sortByDistance').hide();
			$('#sortByEntranceTime').show();
		}
	},
	
	chooseSearchFunction: function(){
		
		app.searchFuncsMainCall = false;
		
		if(app.action == 'getOnlineNow'){					
			app.getOnlineNow();			
		}	
		else if(app.action == 'getStatResults'){					
			app.getStatUsers(app.statAction);
		}
		else if(app.action == 'getSearchResults'){
			app.search();
		}
	},
	
	
	getOnlineNow: function(){
		app.showPage('users_list_page');		
		app.currentPageWrapper.find('.content_wrap').html('');
		app.userTemplate = $('#userDataTemplate').html();
		app.usersContainer = app.currentPageWrapper.find('.content_wrap');
		app.action = 'getOnlineNow';
		app.pageNumber = 1;
		app.getUsers();  
	},
		
 
	getUsers: function(){
		
		if(app.pageNumber > 1){
			app.firstBadgeUsersResults = false;
		}
		
		if(app.firstBadgeUsersResults === true){
			app.startLoading();
		}
		//alert(555);
				
		if(app.action == 'getOnlineNow'){
			
			//alert(app.positionSaved);
		
			if(app.searchFuncsMainCall === true && app.positionSaved === true){
				app.sort = '';
				$('.sortButtonWrap').show();
				$('.marTop').show();
				$('#sortByEntranceTime').hide();
				$('#sortByDistance').show();
			}
		}
		else{
			$('.sortButtonWrap').hide();
			$('.marTop').hide();

		}
		
		
		
		if(app.action == 'getOnlineNow'){					
			//app.requestUrl = 'http://m.dating4disabled.com/api/v2/users/online/'+app.itemsPerPage+'/'+app.pageNumber;
			app.requestUrl = 'http://m.dating4disabled.com/api/v2/users/online/count:'+app.itemsPerPage+'/page:'+app.pageNumber+'/sort:'+app.sort;
		}	
		else if(app.action == 'getSearchResults'){
			var countryCode = $('#countries_list').val();
			var regionCode = $('.regionsList select').val();
			var ageFrom = $(".age_1 select").val();
			var ageTo = $(".age_2 select").val();
			var disabilityId = $('#health_list').val();
			var gender = $('#gender').val();
			
			console.log(gender);
			
			
			app.requestUrl = 'http://m.dating4disabled.com/api/v2/users/search/gender:'+gender+'/country:'+countryCode+'/region:'+regionCode+'/age:'+ageFrom+'-'+ageTo+'/disability:'+disabilityId+'/count:'+app.itemsPerPage+'/page:'+app.pageNumber;
		}	
		else if(app.action == 'getStatResults'){					
			app.requestUrl = 'http://m.dating4disabled.com/api/v2/user/statistics/'+app.statAction+'/count:'+app.itemsPerPage+'/page:'+app.pageNumber;
			console.log(app.requestUrl);
		}
		
		//alert(1);
		
		$.ajax({						
			url: app.requestUrl,
			timeout:10000,
			success: function(response, status){
				app.response = response;
			   $('.loadingHTML').remove();
				//alert(app.response.error);
				//alert(app.response.users.itemsNumber);
				console.log(app.response);
//				console.log(app.response.error);
				app.displayUsers();
				app.sortButtonsHandle();
			}
		});
	},
	
	
	displayUsers: function(){
		
		if(app.response.users.itemsNumber > 0){
		var userId = window.localStorage.getItem("userId");
		
		for(var i in app.response.users.items){
			
			var currentTemplate = app.userTemplate;
			var user = app.response.users.items[i];
			
			currentTemplate = currentTemplate.replace("[USERNICK]",user.nickName);
			currentTemplate = currentTemplate.replace("[AGE]",user.age);
			currentTemplate = currentTemplate.replace("[COUNTRY]",user.country+',');
			currentTemplate = currentTemplate.replace("[CITY]",user.city);
			currentTemplate = currentTemplate.replace("[IMAGE]",user.mainImage);			
			currentTemplate = currentTemplate.replace(/\[USERNICK\]/g,user.nickName);										
			currentTemplate = currentTemplate.replace("[USER_ID]", user.id);	
			
			var aboutUser = '';
			if(typeof(user.about) === 'string'){   
				if(user.about.length > 90){
					aboutUser = user.about.substring(0,90)+'...';
				}
				else{
					aboutUser = user.about;
				}
			}					
			currentTemplate = currentTemplate.replace("[ABOUT]", aboutUser);
			
			
			app.usersContainer.append(currentTemplate);

			/*
			
			if(app.container.hasClass("content_wrap")){
				//$('#users_list_page').find('.content_wrap').append(currentTemplate);
				//alert('has');
				//console.log('HAS');
			}
			else{
				//alert('no');
				//console.log('NO');


				$('#users_list_page').find('.content_wrap').append(currentTemplate);
			}
			 */
			
				
			var currentUserNode = app.usersContainer.find(".user_data:last-child");
			currentUserNode.find(".user_short_txt").attr("onclick","app.getUserProfile("+user.id+");");
			currentUserNode.find(".user_photo_wrap").attr("onclick","app.getUserProfile("+user.id+");");
			
			if(user.isNew == 1){						
				currentUserNode.find(".blue_star").show();
			}					
			if(user.isPaying == 1){						
				currentUserNode.find(".special3").show();
			}
			if(user.isOnline == 1){						
				currentUserNode.find(".on2").show();
			}
			
			if(user.id == userId){
				currentUserNode.find(".send_mes").hide();
			}
			
		}
		
		//$(".send_mes").css({"right":"-20px","top":"0px"});
		
		app.stopLoading();
		app.responseItemsNumber = app.response.users.itemsNumber;
		
		if(app.responseItemsNumber == app.itemsPerPage){
			var loadingHTML = '<div class="loadingHTML">'+$('#loadingBarTemplate').html()+'</div>';
			$(loadingHTML).insertAfter(currentUserNode);
		}
		
		app.setScrollEventHandler();
			
			
			
		}
		else{
			app.container.html("No Results");
		}
	},	
	
	setScrollEventHandler: function(){
		$(window).scroll(function(){	
			app.recentScrollPos = $(this).scrollTop();
			if(app.recentScrollPos >= app.usersContainer.height()-2500){
				$(this).unbind("scroll");				
				if(app.responseItemsNumber == app.itemsPerPage){					
					app.pageNumber++;
					app.getUsers();
				}
			}
		});
	},
	
	getMyProfileData: function(){		
		app.startLoading();
		
		
		
		$("#upload_image").click(function(){		
			$("#statistics").hide();
			$("#uploadDiv").css({"background":"#fff"});
			$("#uploadDiv").show();
			
			$('#get_stat_div').show();
			$('#upload_image_div').hide();
		});
		
		$("#get_stat").click(function(){		
			$("#statistics").show();			
			$("#uploadDiv").hide();
			
			$('#get_stat_div').hide();
			$('#upload_image_div').show();			
		});
		
		
		app.showPage('my_profile_page');
		app.container = app.currentPageWrapper.find('.myProfileWrap');
		app.container.find(".special4").hide();
	    
		/*
		$("#take_a_photo").click(function(){		
			app.capturePhoto(app.pictureSource.CAMERA, app.destinationType.DATA_URL);
		});
		
		$("#choose_from_library").click(function(){		
			app.capturePhoto(app.pictureSource.PHOTOLIBRARY, app.destinationType.FILE_URI);
		});
		*/
		
		
		
		var userId = window.localStorage.getItem("userId");
				
		$.ajax({
			url: 'http://m.dating4disabled.com/api/v2/user/profile/'+userId,						
			success: function(user, status, xhr){
				
				app.container.find('.txt strong').html(user.nickName+', <span>'+user.age+'</span>');			
				app.container.find('.txt strong').siblings('span').text(user.country+', '+user.city); 
				app.container.find('.txt').append(user.about);			
				app.container.find('.user_pic img').attr("src",user.mainImage);
				
			   			   
				if(user.isPaying == 1){
					app.container.find(".special4").show();
				}				
				
				var addedToFriends = user.statistics.fav;  
				var contactedYou = user.statistics.contactedme;
				var contacted = user.statistics.contacted;
				var addedToBlackList = user.statistics.black;
				var addedYouToFriends = user.statistics.favedme;
				var lookedMe = user.statistics.lookedme;
			   
			   //alert(JSON.stringify(user.statistics));
			   
				app.container.find(".stat_side").eq(1).find(".items_wrap").eq(0).find(".stat_value").text(addedToFriends);    
				app.container.find(".stat_side").eq(0).find(".items_wrap").eq(1).find(".stat_value").text(contactedYou);
				app.container.find(".stat_side").eq(1).find(".items_wrap").eq(2).find(".stat_value").text(contacted);
				app.container.find(".stat_side").eq(1).find(".items_wrap").eq(1).find(".stat_value").text(addedToBlackList);
				app.container.find(".stat_side").eq(0).find(".items_wrap").eq(0).find(".stat_value").text(addedYouToFriends);				
				app.container.find(".stat_side").eq(0).find(".items_wrap").eq(2).find(".stat_value").text(lookedMe);
				
				app.stopLoading();				
			}
		});
	},	
	
	getStatUsers: function(statAction){
		if($('#'+statAction).text() > 0){
			app.showPage('users_list_page');
			app.currentPageWrapper.find('.content_wrap').html('');
			app.userTemplate = $('#userDataTemplate').html();
			app.usersContainer = app.currentPageWrapper.find('.content_wrap');
			app.pageNumber = 1;
			app.action = 'getStatResults';
			app.statAction = statAction;
			app.getUsers();
		}
	},
	
	getSearchForm: function(){				
		app.startLoading();
		app.showPage('search_form_page');
		$("#regions_wrap").hide();
		
		app.getCountries();
		app.getDisabilities();		
		
		var html = '<select>';
		for(var i = 18; i <= 80; i++){			
			html = html + '<option value="' + i + '"">' + i + '</option>';
		}		
		html = html + '</select>';		
		
		$(".age_1").html(html);				
		$(".age_1").trigger("create");
		
		var html = '<select>';
		var sel = '';
		for(var i = 19; i <= 80; i++){
			if(i == 40) sel = ' selected="selected"';
			else sel = '';
			html = html + '<option value="' + i + '"' + sel + '>' + i + '</option>';
		}
		html = html + '</select>';		
				
		$(".age_2").html(html);
		$(".age_2").trigger("create");
		
		app.stopLoading();
		
	},
	
	getDisabilities: function(){
		
		$.ajax({
			url: 'http://m.dating4disabled.com/api/v2/list/health',						
			success: function(list, status, xhr){							
				var html = (app.currentPageId == 'register_page') ? '' : '<option value="">All</option>';
				for(var i in list.items){					  
					var item = list.items[i];
					html = html + '<option value="' + item.healthId + '">' + item.healthName + '</option>';
				}
			   
			   var disability = app.container.find("#health_list");
			   disability.html(html);
			   disability.val(disability.val()).selectmenu("refresh");
			}
		});
	},
	
	
	getMobility: function(){
		
		$.ajax({
		   url: 'http://m.dating4disabled.com/api/v2/list/mobility',
		   success: function(list, status, xhr){
		       var html = (app.currentPageId == 'register_page') ? '' : '<option value="">All</option>';
		       for(var i in list.items){
			       var item = list.items[i];
		           html = html + '<option value="' + item.mobilityId + '">' + item.mobilityName + '</option>';
		       }
			   
   			   var mobility = app.container.find("#mobility_list");
    		   mobility.html(html);
		       mobility.val(mobility.val()).selectmenu("refresh");
		   }
    	});
	},
	
	
	
	getSexPreference: function(){
		$.ajax({			
			url: 'http://m.dating4disabled.com/api/v2/list/sexPreference',						
			success: function(list, status, xhr){							
				var html = ''; 
				for(var i in list.items){					  
					var item = list.items[i];					
					html = html + '<option value="' + item.sexPrefId + '">' + item.sexPrefName + '</option>';
				}
				$("#sex_preference_list").html(html);				
				$("#sex_preference_list").val($("#sex_preference_list").val());
				$("#sex_preference_list").find("option[value='1']").insertBefore($("#sex_preference_list").find("option:eq(0)"));
				$("#sex_preference_list").val($("#sex_preference_list").find("option:first").val()).selectmenu("refresh");
				
			}
		
		});
	},
		
	getCountries: function(){
		$.ajax({
			url: 'http://m.dating4disabled.com/api/v2/list/countries',						
			success: function(list, status, xhr){
			   
				var html = '';
				for(var i in list.items){					  
					var item = list.items[i];
				    if(item.countryCode != '--'){
         			   html = html + '<option value="' + item.countryCode + '">' + item.countryName + '</option>';
			        }
				}
			   
				var countriesContainer = app.container.find("#countries_list");
				app.injectCountries(html, countriesContainer);
				app.getRegions(countriesContainer.val());
				countriesContainer.change(function(){
					app.getRegions($(this).val());
				});				
				
				if(app.currentPageId == 'register_page'){
					app.injectCountries(html, app.container.find("#countries_list2"));
				}			
			}
		});
		
	},
	
	injectCountries: function(html, container){
		container.html(html);
		container.trigger('create');
		container.find("option[value='US']").insertBefore(container.find("option:eq(0)"));
		container.find("option[value='CA']").insertBefore(container.find("option:eq(1)"));
		container.find("option[value='AU']").insertBefore(container.find("option:eq(2)"));
		container.find("option[value='GB']").insertBefore(container.find("option:eq(3)"));
		container.val(container.find("option:first").val()).selectmenu("refresh");
	},
	
	
	getRegions: function(countryCode){
		$.ajax({
			url: 'http://m.dating4disabled.com/api/v2/list/regions/'+countryCode,						
			success: function(list, status, xhr){							
				//var html = '<select>';
			   //alert(JSON.stringify(list));
			   
			   var html = '<select name="regionCode">';
				
				if(app.currentPageId == 'search_form_page'){
					html = html + '<option value="">All</option>';
				}
								
				app.container.find("#regions_wrap").hide();
				app.container.find(".regionsList").html('');
				
				app.container.find("#cities_wrap").hide();
				app.container.find(".citiesList").html('');
				
				if(list.itemsNumber > 0){
					for(var i in list.items){					
						var item = list.items[i];					
						html = html + '<option value="' + item.regionCode + '">' + item.regionName + '</option>';
					}
					html = html + '</select>';
					app.container.find(".regionsList").html(html).trigger('create');				
					app.container.find("#regions_wrap").show();
					
					if(app.currentPageId == 'register_page'){
						app.container.find('.regionsList select').change(function(){
							app.getCities(app.container.find("#countries_list").val(),$(this).val());
						});
					}	
				}
				else{
					var html = '<input type="text" name="cityName" id="cityName" />';
					app.container.find(".citiesList").html(html);
					app.container.find("#cities_wrap").show();
				}
				
			}
		});
	},
	
	getCities: function(countryCode,regionCode){
		$.ajax({
			url: 'http://m.dating4disabled.com/api/v2/list/cities/'+countryCode+'/'+regionCode,						
			success: function(list, status, xhr){
				app.container.find("#cities_wrap").hide();				
				if(list.itemsNumber > 0){
					var html = '<select name="cityName">';
					for(var i in list.items){					
						var item = list.items[i];					
						html = html + '<option value="' + item.cityName + '">' + item.cityName + '</option>';
					}
					html = html + '</select>';
					app.container.find(".citiesList").html(html).trigger('create');				
					app.container.find("#cities_wrap").show();				
				}
				else{
					if(countryCode != 'US'){   
						var html = '<input type="text" name="cityName" id="cityName" />';
						app.container.find(".citiesList").html(html);
						app.container.find("#cities_wrap").show();
					}
				}
			}
		});
	},
	
	sendRegData: function(){
		
		if(app.formIsValid()){
			
			app.startLoading();

			
			var data = JSON.stringify(
					$('#regForm').serializeObject()
			);		
			
			$.ajax({
				url: 'http://m.dating4disabled.com/api/v2/user',
				//url: 'http://m.dating4disabled.com/api/insert.asp',
				type: 'Post',
				data: data,
			    error: function(response){
				   console.log( JSON.stringify(response));
				   //alert();
				},
				success: function(response){
					app.response = response;
					console.log( JSON.stringify(app.response));
					if(app.response.result > 0){						
						var user = app.container.find("#userEmail").val(); 
						var pass = app.container.find("#userPass").val();						
						window.localStorage.setItem("user",user);
						window.localStorage.setItem("pass",pass);
						window.localStorage.setItem("userId", app.response.result);
						//alert(window.localStorage.getItem("user") + " " + window.localStorage.getItem("pass"));
						app.ajaxSetup(); 						
						app.getRegStep();
					}
					else{
						app.alert(app.response.err);
					}
				   
					app.stopLoading();

				}
			});
		}
	},	
		
	getRegStep: function(){
		//$('#test_test_page').show();
		app.showPage('upload_image_page');
		$('#back').hide();
		app.container.find('.regInfo').text('Please check your e-mail in order to confirm your registration. You may now upload an image in JPEG format to your profile.'); // Also you may upload an image in your profile now.
		window.scrollTo(0,0);
		
	},
	
	formIsValid: function(){
		//return true;
		var email_pattern = new RegExp(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i);
		
		
		if (!(email_pattern.test($('#userEmail').val()))) {
			alert("Invalid e-mail");
			//$('#userEmail').focus();
			return false;
		}
		
		if ($('#userEmail').val() != $('#userEmail2').val()) {
			alert("Error in retyped email");
			//$('#userEmail2').focus();
			return false;
		}
		
		if ($('#userPass').val().length < 4 || $('#userPass').val().length > 12) {
			alert("Invalid password (must be 4 to 12 characters)");
			//$('#userPass').focus();
			return false;
		}
		
		if ($('#userNic').val().length < 3) {
			alert("Invalid username (must be at least 3 characters)");
			//$('#userNic').focus();
			return false;
		}
		
		if ($('#userPass').val() != $('#userPass2').val()) {
			alert("Error in retyped password");
			//$('#userPass2').focus();
			return false;
		}
		
		if($('#d').val().length == 0 || $('#m').val().length == 0 || $('#y').val().length == 0){
			alert('Invalid date of birth');
			return false;
		}
		
		if($('#cityName').val().length < 3){
			alert('Invalid city (must be at least 3 characters)');
			return false;
		}
		
		if($('#zipCode').val().length < 3){
			alert('Invalid zip code');
			return false;
		}
		
		if($('#aboutMe').val().length < 20){
			alert('Invalid About Me (must be at least 20 characters)');
			return false;
		}
		
		if($('#lookingFor').val().length < 20){
			alert('Invalid Looking For (must be at least 20 characters)');
			return false;
		}
		
		if($('#confirm option:selected').val() != "1"){
			alert('Please check confirmation box');
			return false;
		}
		
		
		return true;
	},
	
	search: function(pageNumber){
		app.showPage('users_list_page');		
		app.userTemplate = $('#userDataTemplate').html();
		app.usersContainer = app.currentPageWrapper.find('.content_wrap');
		app.usersContainer.html('');
		app.pageNumber = 1;
		app.action = 'getSearchResults';
		app.getUsers();
	},
	
	reportAbuse: function(){
		
		var abuseMessage = $('#abuseMessage').val();
		
		$.ajax({
			url: 'http://m.dating4disabled.com/api/v2/user/abuse/'+app.reportAbuseUserId,
			type: 'Post',
			contentType: "application/json; charset=utf-8",
			data: JSON.stringify({
				abuseMessage: abuseMessage
			}),
			success: function(response, status, xhr){
			   $('#abuseMessage').val('');
			   app.alert('Thank you for your report. The message has been sent');
			   app.back();
			}
		});
	},
	
	getUserProfile: function(userId){		

		
		app.ajaxSetup();
		app.startLoading();
		
		//app.container.find('#pic1, #pic2, #pic3').attr("src","");
		$('#pic1').attr("src","");
		$('#pic2').attr("src","");
		$('#pic3').attr("src","");
		
		//alert(app.currentPageId);
		
				
		$.ajax({
			url: 'http://m.dating4disabled.com/api/v2/user/profile/'+userId,
			type: 'Get',
			success: function(user, status, xhr){
			   
				//alert(user.userId);
			   app.showPage('user_profile_page');
			   app.reportAbuseUserId = userId;
			   //alert(JSON.stringify(user));
				window.scrollTo(0, 0);
				var detailsContainer = app.container.find('#user_details');
				//app.container.find('#pic1, #pic2, #pic3').attr("src","");
			   
				app.container.find(".special3, .blue_star, .on5, .pic_wrap").hide();
				app.container.find('.pic_wrap').addClass("left").removeClass("center");
				
				app.container.find('#pic1').parent('a').addClass("fancybox");
				app.container.find("h1 span").text(user.nickName);
				app.container.find('#pic1').attr("src",user.mainImage).parent('a').attr({"href":user.mainImage, "rel":"images_"+user.userId});
								
				if(user.mainImage == "http://m.dating4disabled.com/images/no_photo_female.jpg" 
				|| user.mainImage == "http://m.dating4disabled.com/images/no_photo_male.jpg"){
					app.container.find('#pic1').parent('a').removeClass("fancybox").attr("href","#");
				}
				
				app.container.find('.pic_wrap').eq(0).show();				
			   app.container.find('.fancybox').fancybox({
					direction:{
						next : 'left',
					    prev : 'right'
					}
			   });
				
				//alert(user.otherImages[0]);
				//return;
				
				if(typeof user.otherImages[0] !== "undefined"){ 
					//alert(user.otherImages[0]);
					app.container
						.find('.pic_wrap').eq(1).show()
						.find("img").attr("src",user.otherImages[0])
						.parent('a')
						.attr({"href":user.otherImages[0], "rel":"images_"+user.userId});
				}else{
					app.container.find('.pic_wrap').eq(0).addClass("center").removeClass("left");
				}
				
				if(typeof user.otherImages[1] !== "undefined"){
					//alert(user.otherImages[1]);
					app.container.find('.pic_wrap').eq(2).show()
						.find("img").attr("src",user.otherImages[1])
						.parent('a').attr({"href":user.otherImages[1], "rel":"images_"+user.userId});
				}
								
				if(user.isPaying == 1){
					app.container.find(".special3").show();
				}
				
				if(user.isNew == 1){
					app.container.find(".blue_star").show();
				}				
				
				if(user.isOnline == 1){
					app.container.find(".on5").show();
				}
				
				app.profileGroupTemplate = $('#userProfileGroupTemplate').html();
				app.profileLineTemplate = $('#userProfileLineTemplate').html();
			   
				var profileButtonsTemplate = $('#userProfileButtonsTemplate').html();
				var profileButtonsTemplate_2 = $('#userProfileButtonsTemplate_2').html();
				profileButtonsTemplate = profileButtonsTemplate.replace(/\[USERNICK\]/g,user.nickName);									
				profileButtonsTemplate = profileButtonsTemplate.replace("[USER_ID]", user.userId);
			   
				if(user.userId != window.localStorage.getItem('userId')){
					var profileButtonsTemplate = $('#userProfileButtonsTemplate').html();
					var profileButtonsTemplate_2 = $('#userProfileButtonsTemplate_2').html();
					profileButtonsTemplate = profileButtonsTemplate.replace(/\[USERNICK\]/g,user.nickName);
					profileButtonsTemplate = profileButtonsTemplate.replace("[USER_ID]", user.userId);
				}
				else{
					var profileButtonsTemplate = '';
					var profileButtonsTemplate_2 = '';
				}
			   
			   
			   
				//profileButtonsTemplate.insertBefore(detailsContainer);
				
				var html = profileButtonsTemplate; 
				 				
				html = html + app.getProfileGroup("General Information");				
				html = html + app.getProfileLine("Nickname", user.nickName);
				html = html + app.getProfileLine("Age", user.age);
				html = html + app.getProfileLine("City", user.city);
				html = html + app.getProfileLine("Region", user.region);				
				html = html + app.getProfileLine("Country", user.country);				
				html = html + app.getProfileLine("Sexual Prefernce", user.sexPreference);				
				html = html + app.getProfileGroup("Background");
				html = html + app.getProfileLine("Relationship Status", user.maritalStatus);
				html = html + app.getProfileLine("Children", user.children);
				html = html + app.getProfileLine("I am looking for", user.lookingFor);
				html = html + app.getProfileLine("My Ethnicity", user.ethnity);
				html = html + app.getProfileLine("My Religion", user.religion);
				html = html + app.getProfileLine("My Education", user.education);
				html = html + app.getProfileLine("Country I was born in", user.birthCountry);
				html = html + app.getProfileLine("My Annual Income", user.income);
				html = html + app.getProfileLine("Occupation", user.occupation);				
				html = html + app.getProfileGroup("Physical appearance");				
				html = html + app.getProfileLine("Appearance", user.appearance);
				html = html + app.getProfileLine("Body Type", user.bodyType);				
				html = html + app.getProfileLine("Height", user.height);
				html = html + app.getProfileLine("Weight", user.weight);
				html = html + app.getProfileLine("Hair color", user.hairColor);
				html = html + app.getProfileLine("Hair style", user.hairLength);
				html = html + app.getProfileLine("Eye color", user.eyesColor);				
				html = html + app.getProfileGroup("Personality And Interests");				
				html = html + app.getProfileLine("My Hobbies", user.hobbies);
				html = html + app.getProfileLine("Drinking Habits", user.drinking);
				html = html + app.getProfileLine("Smoking Habits", user.smoking);				
				html = html + app.getProfileGroup("Disability Information");				
				html = html + app.getProfileLine("My Life Challenge", user.disability);
				html = html + app.getProfileLine("Mobility", user.mobility);
				html = html + profileButtonsTemplate + profileButtonsTemplate_2;

			   
				
				detailsContainer.html(html).trigger('create');
				
				app.stopLoading();				
			}
		});
	},
	
	
	getProfileGroup: function(groupName){
		var group = app.profileGroupTemplate;
		return group.replace("[GROUP_NAME]", groupName);
	},
	
	getProfileLine: function(lineName, lineValue){
		var line = app.profileLineTemplate;
		line = line.replace("[LINE_NAME]", lineName);
		line = line.replace("[LINE_VALUE]", lineValue);
		return line;
	},
	
	getMessenger: function(){		
		app.startLoading();
		
		$.ajax({
			url: 'http://m.dating4disabled.com/api/v2/user/contacts',									
			success: function(response){
				app.response = response;
				app.showPage('messenger_page');
				app.container = app.currentPageWrapper.find('.chats_wrap');
				app.container.html('');
				app.template = $('#messengerTemplate').html();
			   console.log(app.response);
				
				for(var i in app.response.allChats){					
					var currentTemplate = app.template; 
					var chat = app.response.allChats[i];
					currentTemplate = currentTemplate.replace("[IMAGE]",chat.user.mainImage);
					currentTemplate = currentTemplate.replace(/\[USERNICK\]/g,chat.user.nickName);
					currentTemplate = currentTemplate.replace("[RECENT_MESSAGE]",chat.recentMessage.text);
					currentTemplate = currentTemplate.replace("[DATE]", chat.recentMessage.date);					
					currentTemplate = currentTemplate.replace("[USER_ID]", chat.user.userId);
					
					app.container.append(currentTemplate);
					
					var currentUserNode = app.container.find(":last-child");
			   
					//alert(JSON.stringify(chat));
			   
					if(chat.newMessagesCount > 0){
						//alert(chat.newMessagesCount);
						currentUserNode.find(".new_mes_count").html(chat.newMessagesCount).show();
					}
			   
				}
				app.stopLoading();
			}
		});
	},
	
	getChat: function(chatWith, userNick){
		
		app.chatWith = chatWith;
		app.startLoading();
		
		$.ajax({
			url: 'http://m.dating4disabled.com/api/v2/user/chat/'+app.chatWith,									
			success: function(response){				
				app.response = response;
				app.showPage('chat_page');
				window.scrollTo(0, 0);
				app.container = app.currentPageWrapper.find('.chat_wrap');
				app.container.html('');
				app.template = $('#chatMessageTemplate').html();				
				//app.currentPageWrapper.find('.content_wrap').find("h1 span").text(userNick);
				app.currentPageWrapper.find('.content_wrap').find("h1 span").text(userNick).attr("onclick", "app.getUserProfile('"+app.chatWith+"');")
				var html = app.buildChat();
				app.container.html(html);
				app.refreshChat();
				app.stopLoading();
			}
		});
	},
	
	buildChat: function(){
		var html = '';
		var k = 1;
		var appendToMessage = '';
		
		//alert(JSON.stringify(app.response.chat));
		
		if(app.response.chat.abilityReadingMessages == 0){
			//alert(2);

			var appendToMessage = '<br /><span onclick="app.getSubscription();" class="ui-link">Click here to get subscription</span>';
		}
		
		
		for(var i in app.response.chat.items){					
			var currentTemplate = app.template; 
			var message = app.response.chat.items[i];
			
			//alert(JSON.justify(message));
			
			if(app.chatWith == message.from){
				var messageType = "message_in";
				if(message.isRead == 0){
					message.text = message.text + appendToMessage;
				}
			} 
			else 
				var messageType = "message_out";
			
			if(from == message.from) k--;
			
			if(k % 2 == 0){
				messageFloat = "right";
				info = "info_right";
			} 
			else{
				messageFloat = "left";
				info = "info_left";
			}
			
			currentTemplate = currentTemplate.replace("[MESSAGE]", message.text);
			currentTemplate = currentTemplate.replace("[DATE]", message.date);
			currentTemplate = currentTemplate.replace("[TIME]", message.time);
			currentTemplate = currentTemplate.replace("[MESSAGE_TYPE]", messageType);
			currentTemplate = currentTemplate.replace("[MESSAGE_FLOAT]", messageFloat);
			currentTemplate = currentTemplate.replace("[INFO]", info);
			
			html = html + currentTemplate;
			
			var from = message.from;
			
			k++;
		}
		
		return html;
	},
	
	sendMessage: function(){		
		var message = $('#message').val();
		if(message.length > 0){
			$('#message').val('');
			app.startLoading();
			$.ajax({
				url: 'http://m.dating4disabled.com/api/v2/user/chat/'+app.chatWith,
				type: 'Post',
				contentType: "application/json; charset=utf-8",
				data: JSON.stringify({			
					message: message 
				}),
				success: function(response){
				   app.stopLoading();
				   if(app.currentPageId == 'chat_page'){
						app.response = response;
						var html = app.buildChat();
						app.container.html(html);
						app.refreshChat();
					}
				}
			});
		
		}
	},
	
	
	refreshChat: function(){
		
		if(app.currentPageId == 'chat_page'){		
			$.ajax({
				url: 'http://m.dating4disabled.com/api/v2/user/chat/'+app.chatWith+'/refresh',
				type: 'Get',			
				success: function(response){
				   if(app.currentPageId == 'chat_page'){
						app.response = response;
				   //alert(1);

						if(app.response.chat != false){
							var html = app.buildChat();
							app.container.html(html);
						}
					//else alert(app.response.chat);
					
						refresh = setTimeout(app.refreshChat, 100);
				   
				   }
				}
			});
		}
		else{
			clearTimeout(refresh);
		}
		
	},
	
	checkNewMessages: function(){
		
		if(app.currentPageId != 'login_page' && app.currentPageId != 'register_page'){
			$.ajax({
				url: 'http://m.dating4disabled.com/api/v2/user/newMessagesCount',
				type: 'Get',
				complete: function(response, status, jqXHR){
					//don't remove this "complete" function, this is overriding of global "complete".
				},			
				success: function(response){
					app.response = response;				
					//alert(app.response.newMessagesCount);
					if(app.response.newMessagesCount > 0){
						app.newMessagesCount = app.response.newMessagesCount;
						if(app.currentPageId != 'login_page' && app.currentPageId != 'main_page' && app.currentPageId != 'register_page'){
							$('.new_mes_count2').show().html(app.newMessagesCount);
							//$(".new_mes").show();
						}
						else{
							$(".new_mes").hide();
							if(app.currentPageId == 'main_page'){
				   
								//alert(app.newMessagesCount);
								$('#new_mes_count').show().html(app.newMessagesCount);
							}
						}
					}
					else{
						app.newMessagesCount = 0;
						$('.new_mes').hide();
					}
					newMesssages = setTimeout(app.checkNewMessages, 10000);
				}
			});
		}
		
	},
	
	getSubscription: function(){
		app.startLoading();
		app.showPage('subscription_page');
		$(".subscr_quest").unbind('click');
		$(".subscr_quest").click(function(){
			$(this).siblings(".subscr_text").slideToggle("slow");
			var span = $(this).find("span");
			if(span.text() == '+')
				span.text('-');
			else
				span.text('+');
		});
		
		$('input[type="radio"]').removeAttr("checked");
		
		IAP.initialize();
		
		
		$(".subscr").click(function(){
			$(".subscr_left").removeClass("subscr_sel");
			$(this).find("input").attr("checked","checked");
			$(this).find(".subscr_left").addClass("subscr_sel");
			
			
			/*
			setTimeout(function(){
				var product_id = $(".subscr_ch:checked").val();
				var nickName = '';
				//window.location.href = 'https://www.2checkout.com/2co/buyer/purchase?sid=1400004&quantity=1&product_id='+product_id+'&userid='+app.userId+'&usernick='+nickName;				
				var ref = window.open('https://www.2checkout.com/2co/buyer/purchase?sid=1400004&quantity=1&product_id='+product_id+'&userid='+app.userId+'&usernick='+nickName, '_blank', 'location=yes');
				
				
			},100);
			 */
		});
		
		
	},
	
	confirmDeleteImage: function(imageId){
		app.imageId = imageId;		
		navigator.notification.confirm(
				'Delete this image?',  // message
		        app.deleteImageChoice,              // callback to invoke with index of button pressed		       
		        'Confirmation',            // title
		        'Confirm,Cancel'          // buttonLabels
		 );
	},
	
	deleteImageChoice: function(buttonPressedIndex){
		if(buttonPressedIndex == 1){
			app.deleteImage();
		}
	},
	
	deleteImage: function(){
		app.requestUrl = 'http://m.dating4disabled.com/api/v2/user/images/delete/' + app.imageId,
		app.requestMethod = 'Post';
		app.getUserImages();
	},
	
	displayUserImages: function(){
		app.requestUrl = 'http://m.dating4disabled.com/api/v2/user/images';
		app.requestMethod = 'Get';
		app.getUserImages();
	},
	
	getUserImages: function(){
		$('.imagesButtonsWrap').hide();
		$.ajax({
			url: app.requestUrl,
			type: app.requestMethod,			
			success: function(response){
								
				app.response = response;
				app.showPage('delete_images_page');
				app.container = app.currentPageWrapper.find('.imagesListWrap');
				app.container.html('');
				app.template = $('#editImageTemplate').html();
				window.scrollTo(0,0);
				
				if(app.response.images.itemsNumber < 4)
					$('.imagesButtonsWrap').show();
				
				for(var i in app.response.images.items){					
					var currentTemplate = app.template; 
					var image = app.response.images.items[i];					
					currentTemplate = currentTemplate.replace("[IMAGE]", image.url);
					currentTemplate = currentTemplate.replace("[IMAGE_ID]", image.id);
					app.container.append(currentTemplate);					
					var currentImageNode = app.container.find('.userImageWrap:last-child');
															
					if(image.isValid == 1)
						currentImageNode.find('.imageStatus').html("Approved").css({"color":"green"});
					else						
						currentImageNode.find('.imageStatus').html("Not Approved Yet").css({"color":"red"});
					
				}
				
				app.container.trigger('create');
			}
		});
	},
	
	capturePhoto: function(sourceType, destinationType){
		// Take picture using device camera and retrieve image as base64-encoded string	
		var options = {
			quality: 100, 
			destinationType: app.destinationType.FILE_URI,
			sourceType: sourceType,
			encodingType: app.encodingType.JPEG,
			targetWidth: 600,
			targetHeight: 600,		
			saveToPhotoAlbum: false,
			chunkedMode:true,
			correctOrientation: true
		};
		
		navigator.camera.getPicture(app.onPhotoDataSuccess, app.onPhotoDataFail, options);
		
	},
	
	onPhotoDataSuccess: function(imageURI) {		
		/*
		$("#myNewPhoto").attr("src","data:image/jpeg;base64," + imageURI);
		$('#myNewPhoto').Jcrop({
			onChange: showPreview,
			onSelect: showPreview,
			aspectRatio: 1
		});
		*/
		app.uploadPhoto(imageURI); 
	},
	
	onPhotoDataFail: function() {
		
	},
	
	uploadPhoto: function(imageURI){
		app.startLoading();
		var user = window.localStorage.getItem("user");
		var pass = window.localStorage.getItem("pass");		
		var options = new FileUploadOptions();
        options.fileKey="file";
        options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
        options.mimeType="image/jpeg";
        options.headers = {"Authorization": "Basic " + btoa ( user + ":" + pass)}; 
        
        var ft = new FileTransfer();
        ft.upload(
        	imageURI, 
        	encodeURI("http://m.dating4disabled.com/api/v2/user/image"), 
        	app.uploadSuccess, 
        	app.uploadFailure,
	        options
	    );
	},
	
	uploadSuccess: function(r){
		//console.log("Code = " + r.responseCode);
        //console.log("Response = " + r.response);
        //console.log("Sent = " + r.bytesSent);
        //alert(r.response);
		
		app.stopLoading();
		
		app.response = JSON.parse(r.response);
		//alert(JSON.stringify(app.response));
		if(app.response.status.code == 0){
			
			navigator.notification.confirm(
				app.response.status.message + '. Click on "Manage Images" button to delete images',  // message
		        app.manageImagesChoice,              // callback to invoke with index of button pressed		       
		        'Notification',            // title
		        'Manage Images,Cancel'          // buttonLabels
		    );
			
		}else if(app.response.status.code == 1){
			app.alert(app.response.status.message);
		}
		
		if(app.currentPageId == 'delete_images_page'){
			app.displayUserImages();
		}
		
	},
	
	manageImagesChoice: function(buttonPressedIndex){
		if(buttonPressedIndex == 1){
			app.displayUserImages();
		}
	},
	
	uploadFailure: function(error){
		 alert("An error has occurred. Please try again.");
	},
	
	
	register: function(){		
		app.showPage('register_page');		
		$('#birthDate').html(app.getBithDate()).trigger('create');
		app.getCountries();
		app.getSexPreference();
		app.getDisabilities();
		app.getMobility();
		$(".new_mes").hide();
	},
	
	getBithDate: function(){
		var html;		
		html = '<div class="left">';
			html = html + '<select name="userBirthday_d" id="d">';
				html = html + '<option value="">D</option>';
				for (var i = 1; i <= 31; i++) {
					html = html + '<option value="' + i + '">' + i + '</option>';
				}		
			html = html + '</select>';		
		html = html + '</div>';
		
		html = html + '<div class="left">';
			html = html + '<select name="userBirthday_m" id="m">';
				html = html + '<option value="">M</option>';
				for (var i = 1; i <= 12; i++) {
					html = html + '<option value="' + i + '">' + i + '</option>';
				}		
			html = html + '</select>';		
		html = html + '</div>';
						
		var curYear = new Date().getFullYear();
		
		html = html + '<div class="left">';
			html = html + '<select name="userBirthday_y" id="y">';
				html = html + '<option value="">Y</option>';
				for (var i = curYear - 18; i >=1940 ; i--) {
					html = html + '<option value="' + i + '">' + i + '</option>';
				}		
			html = html + '</select>';	
		html = html + '</div>';
		
		return html;
	},
	
	
	
	
	dump: function(obj) {
	    var out = '';
	    for (var i in obj) {
	        out += i + ": " + obj[i] + "\n";
	    }
	    alert(out);
	}	
	
		
};


//document.addEventListener("deviceready", app.init, false);


function onsuccess(){
	
}

function onerror(){
	
}

function onBodyLoad(){
	//initFastButtons();
	document.addEventListener("deviceready", app.init, false);
}


window.addEventListener('load', function() {
	new FastClick(document.body);
}, false);


function showPreview(coords)
{
	var rx = 100 / coords.w;
	var ry = 100 / coords.h;

	$('#preview').css({
		width: Math.round(rx * 500) + 'px',
		height: Math.round(ry * 370) + 'px',
		marginLeft: '-' + Math.round(rx * coords.x) + 'px',
		marginTop: '-' + Math.round(ry * coords.y) + 'px'
	});
}


$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};