import React, {Component, useEffect} from 'react';
import {
  View,
  Text,
  Platform,
  Image,
  Dimensions,
  Modal,
  Linking,
  TextInput,
  StyleSheet,
  Share,
} from 'react-native';
import Utils from './common/Utils';
import Config from './common/Config';
import {Appbar} from 'react-native-paper';
import {CText, Styles, CSpinner} from './common';
import AsyncStorage from "@react-native-async-storage/async-storage";

class article extends Component {
  static navigationOptions = {
    title: 'article',
  };
  constructor() {
    super();
    this.notificationListener();
    // this.DeepLinkFunction();
    this.state = {inviteCode: '', referralData: '', linkingURL: ''};
  }

  // componentDidMount() {
  //     React.useEffect(()=>{
  //         Linking.addEventListener('url',this.handleOpenURL )
  //         return()=>Linking.removeEventListener('url'.this.handleOpenURL)
  //     })
  // }
  //
  // handleOpenURL = (event) => { // D
  //     console.log('deep handleOpenURL event ', event);
  //  }

  notificationListener() {
    // console.warn('notificationListener fun enter');
    // 0-none,1-Alert in Screen,2-Notification in background
  }

  DeepLinkFunction() {
    if (Platform.OS === 'android') {
      Linking.getInitialURL().then(url => {
        console.log('deep function url=====@==', url);
        this.navigate(url);
      });
    } else {
      Linking.addEventListener('url', this.handleOpenURL);
    }
  }

  componentDidMount() {
    console.log('componentDidMount start====');
  }

  componentWillUnmount() {
    // C
    // console.log('componentWillUnmount called');
    this.checkNotificationURL();
    Linking.removeEventListener('url', this.handleOpenURL);
  }

  onReceived(notification) {
    console.log('aricle Notification received: ', notification);
  }

  onOpened(openResult) {
    console.log('aricle onOpened openResult====', openResult);
    const self = this;
    console.log(
      'aricle launchURL: ',
      openResult.notification.payload.launchURL,
    );
    // console.log('Homescreen Data: ', openResult.notification.payload.additionalData);
    // console.log('Homescreen isActive: ', openResult.notification.isAppInFocus);
    // console.log('Homescreen openResult: ', openResult);
    if (openResult.notification.isAppInFocus === true) {
      // Utils.dialogBox('notification on open','');
    }
    if (openResult.notification.payload.launchURL === 'Whizzard://article') {
      // if (openResult.notification.payload.launchURL === 'Whizzard://Message') {
      // if (openResult.notification.payload.launchURL === 'Whizzard://Notifications') {
      // console.log('inside condition');
      let notificationURL = openResult.notification.payload.launchURL;
      Utils.setToken(
        'notificationURLCheck',
        JSON.stringify(notificationURL),
        function (d) {},
      );
      // console.log('inside done');
    } else {
      // console.log('outside condition');
      Utils.setToken('notificationURLCheck', null, function (d) {});
    }
  }

  //Check Notification URL
  async checkNotificationURL() {
    AsyncStorage.getItem('Whizzard:notificationURLCheck').then(
      notificationURLCheck => {
        console.log('==typeof', typeof notificationURLCheck);
        console.log('===notificationURL', notificationURLCheck);
        if (JSON.parse(notificationURLCheck)) {
          console.warn('Deep Linking Screen', notificationURLCheck);
          this.setState({linkingURL: notificationURLCheck});
          Utils.setToken('notificationURLCheck', 'null', function (d) {});
          this.props.navigation.navigate('Notifications');
        } else {
          Utils.setToken('notificationURLCheck', 'null', function (d) {});
          this.props.navigation.navigate('authNavigator');
        }
      },
    );
  }

  handleOpenURL = event => {
    // D
    console.log('deep handleOpenURL event ', event);
    this.navigate(event.url);
  };

  navigate = url => {
    // E
    console.log('deep URL==', url);
    // const {navigate} = this.props.navigation;
    // const route = url.replace(/.*?:\/\//g, '');
    // console.log('deep route', route);
    // const id = route.match(/\/([^\/]+)\/?$/)[2];
    // console.log('deep id', id);
    // const routeName = route.split('/')[0];
    // console.log('deep routeName', routeName);

    // if (routeName === 'article') {
    //     navigate('article', {id, name: 'chris'})
    // }
    if (url) {
      console.warn('Deep Linking Screen');
      this.setState({linkingURL: url});
    } else {
      this.props.navigation.navigate('authNavigator');
    }
  };

  render() {
    const {id} = 1; // B
    // if (!people[id]) return <Text>Sorry, no data exists for this user</Text>
    return (
      <View style={[Styles.flex1, Styles.bgLYellow]}>
        <Appbar.Header style={[Styles.bgWhite]}>
          {/*<Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>*/}
          <Appbar.Action />
          <Appbar.Content
            style={[Styles.ffMlight]}
            title="article screen"
            subtitle=""
          />
        </Appbar.Header>
        <View style={[Styles.flex1, Styles.alignCenter]}>
          <Text>HELLO,</Text>
          <Text>DEEP LINKING SCREEN,Article</Text>
          <Text>{this.state.linkingURL}</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  input: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderColor: '#f5f5f5',
    borderWidth: 2,
    borderRadius: 3,
    textAlign: 'center',
    paddingHorizontal: 15,
    marginVertical: 20,
  },
  text: {
    margin: 19,
    fontSize: 22,
  },
  image: {
    width: 400,
    height: 400,
  },
});
export default article;
