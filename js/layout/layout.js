/**
 * Created by lujianhao on 2016/10/20.
 */
// $(function(){  
    // 设置jQuery Ajax全局的参数  
    // $.ajaxSetup({  
    //     type: "GET",
    //     error: function(jqXHR, textStatus, errorThrown){
    //         switch (jqXHR.status){  
    //             case(401):
    //                 window.location.href = "/backstage/login.html";
    //                 break;
    //             case(403):
    //                 window.location.href = "/backstage/login.html";
    //                 break;
    //         }
    //     },
    // });
// });  

$(document).on({
  'ajaxError': function(event, jqxhr, settings, thrownError) {
    if (jqxhr.status === 401 || jqxhr.status === 403) {
      // 登录地址
      var loginUrl = 'login.html';
      window.location.href = loginUrl
    }
  }
});

function active(self){
    $('.treeview-menu li').removeClass('active');
    $(self).addClass('active');
}

$.get("/pc/permission/queryPermissionTree",function(data){
    var parents = data.data;
    var value = parentHtml(parents);
    $("#menu_list").html(value);
},"json");

var parentHtml = function(parent_data){
    var htmlText = "";
    $.each(parent_data,function(i,element){
        // console.log(element);
        var test = childHtml(element.child);
        if(test!=""){
            htmlText = htmlText+"<li class='treeview'><a href='#'><i class='fa "+ element.permissionICO+"'></i><span>"+element.permissionName+"</span><span class='pull-right-container'><i class='fa fa-angle-left pull-right'></i></span></a>" +
            "<ul class='treeview-menu'>"+childHtml(element.child)+"</ul></li>"
        }
    })
    return htmlText;
}

var childHtml = function(child_data){
    var childHtmlText = "";
    $.each(child_data,function(i,element){
        childHtmlText = childHtmlText+"<li onclick='active($(this))'><a href='"+element.permissionUrl+"'><i class='fa "+ element.permissionICO +"'></i>"+element.permissionName+"</a></li>"
    });
    return childHtmlText;
}

$(document).ready(
    $.get("/pc/user/queryCurrentUserInfo",function(data){
        var userName = data.userName;
        var email = data.email;
        var cellPhoneNum = data.cellPhoneNum;
        var position = data.position;
        var sex = data.sex;
        $("#tel").text(cellPhoneNum);
        $("email").text(email);
        $("#loginUserName").text(userName);
        $("#personalJob").text(position);
        $("#loginUserName2").after(userName);
        $("#currentUserName").after(userName);
        if(sex==null){
            sex = 0;
        }
        if(sex == 0){
            $("#headPic").append("<img src='web/image/male_avatar.png' class='img-circle' alt='User Image'>");
            $("#headPic2").attr('src','web/image/male_avatar.png');
            $("#headPic3").attr('src','web/image/male_avatar.png');
        }else{
            $("#headPic").append("<img src='web/image/female_avatar.png' class='img-circle' alt='User Image'>");
            $("#headPic2").attr('src','web/image/female_avatar.png');
            $("#headPic3").attr('src','web/image/female_avatar.png');
        }
    })
)

// $(function(){
//     $('.treeview-menu li').click(function(){
//         alert('111');
//     });
// });

$(function(){
   $('#signout').click(function(){
       $.get("/pc/user/logout",function(data){
           var result = data.resultCode;
           if(result!=null||'success'==result){
               location.href = "login.html"
           }
       },"json")
   });
});


$(function(){
    $('#modifypwd').click(function(){
        $.get("web/system/edit_pwd.html").success(function(html){
            html = $(html);
            Dialog.show({
                title: '修改密码',
                message: html,
                submit: function(data, dialog) {
                    $.post('/pc/user/modifyPwd', data)
                        .success(function(val) {
                            if(val == 'success'){
                                Dialog.alert({
                                    message: '密码修改成功。',
                                    size: 'size-small',
                                    type: 'type-success'
                                });
                                dialog.close();
                            }

                            if(val == 'failure'){
                                Dialog.alert({
                                    message: '密码修改失败。',
                                    size: 'size-small',
                                    type: 'type-success'
                                });
                            }

                            if(val == 'checkInputPwd'){
                                Dialog.alert({
                                    message: '新密码不能为空。',
                                    size: 'size-small',
                                    type: 'type-success'
                                });
                            }

                            if(val == 'differentPwd'){
                                Dialog.alert({
                                    message: '密码两次输入不一致。',
                                    size: 'size-small',
                                    type: 'type-success'
                                });
                            }

                            if(val == 'oldPwdNotEqual'){
                                Dialog.alert({
                                    message: '旧密码输入有误。',
                                    size: 'size-small',
                                    type: 'type-success'
                                });
                            }
                        })
                },
                buttons: [{
                    label: '取消',
                    action: function(dialog) {
                        dialog.close();
                    }
                }, {
                    label: '保存',
                    cssClass: 'btn-primary',
                    action: function(dialog) {
                        dialog.submit();
                    }
                }]
            });
        })
    });
});
