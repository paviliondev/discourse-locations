import { withPluginApi } from 'discourse/lib/plugin-api';

export default {
    name:'location-map-renderer',
    initialize(){

        withPluginApi('0.3', api => {
            api.modifyClass('route:users', {
                renderTemplate() {
                    const currentUrl = this.get('router.currentURL');
                    if (currentUrl.indexOf('user-map') > -1) {
                        console.log('working');
                        this.render("users/user-map");
                    } else {
                        this.render('users');
                    }
                }
            });
        });

    }
};