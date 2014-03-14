module.exports = {
	homePage: {
		pattern: "/",
		action: "homePage",
	},
	userPage: {
		pattern: "/user/(int:id)/(slug:name).html",
		action: "userPage",
	}
}
