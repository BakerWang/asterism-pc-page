/**
 * Created by lujianhao on 2016/10/10.
 */
$('#loginButton').bind('click',function(){
     var emailOrTelephone = $('#emailOrTelephone').val();
     var password = encodeURIComponent($('#password').val());
     var data = null;
     $.getJSON('/userCenter/keyPair',function(data) {
        var modulus = data.ownModulus, exponent = data.exponent;
        if (password.length != null) {
            var publicKey = RSAUtils.getKeyPair(exponent, '', modulus);
            password = RSAUtils.encryptedString(publicKey, password);
            if(emailOrTelephone.indexOf("@")!=-1){
                data = {"data":{"registerEmail":emailOrTelephone,"loginFlag":"1","password": password}};
            }else{
                data = {"data":{"telephone":emailOrTelephone,"loginFlag":"0","password":password}};
            }
            $.ajax({
                url:'/userCenter/login',
                data:JSON.stringify(data),
                contentType:'application/json',
                type:'POST',
                dataType : 'json',
                success:function(val){
                    var json = eval(val);
                    if(json.result === 'success'){
                        if(json.data.userName==null &&json.data.position==null&&json.data.baseUserId!=null){
                            location.href = "web/login/chooseCompany.html?baseUserId="+encodeURI(json.data.baseUserId);
                        }else{
                            location.href = "layout.html";
                        }
                    }else{
                        $("#passwordSpan").html("<span style='color:#ff0000'>用户名或密码错误</span>");
                    }
                }
            });
        }
     });
});
