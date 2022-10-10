$(document).ready(function () {
    let $entryButton = $("#entry-btn");
    let $viewButton = $("#view-btn");
    let $jokeButton = $("#joke-btn")
    let $fieldset = $("fieldset");
    // let $favJokeButton = $("#fav-joke-btn");
    let $loginForm = $("#login-form");
    let $signinButton = $("#signin-btn");
    let $newAccountButton = $("#new-account-btn");
    let $logoutButton = $("#logout-btn");
    let $cancelButton = $("#cancel-btn");
    let $jokeContainer = $("#joke-container");

    $signinButton.click(function() {
        $loginForm.removeClass("hide");
        $signinButton.addClass("hide");
        $newAccountButton.addClass("hide");
    });

    $cancelButton.click(function() {
        $loginForm.addClass("hide");
        $signinButton.removeClass("hide");
        $newAccountButton.removeClass("hide")
    })

    $newAccountButton.click(function() {
        location.href="/register";
    });

    $logoutButton.click(function() {
        location.href="/logout";
    })

    $entryButton.click(function() {
        location.href="create";
    });

    $viewButton.click(function() {
        location.href="show";
    });

    $jokeButton.click(function() {
        location.href="joke";
    });

    $("#fav-joke-btn").click(function() {
        location.href="favjoke";
    });

    $("#menuback-btn").click(function() {
        location.href="/menu";
    })
});