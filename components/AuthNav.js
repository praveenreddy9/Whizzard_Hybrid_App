import React, {Component} from 'react';
import {
  View,
  Image,
  Dimensions,
  Modal,
  Linking,
  Text,Platform,
} from 'react-native';
import Utils from './common/Utils';
import Config from './common/Config';
import {CText, LoadImages, LoadSVG, Styles} from './common';
import {Button, Card} from 'react-native-paper';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';
import {withNavigation} from 'react-navigation';
import Services from './common/Services';
import DeviceInfo from 'react-native-device-info';
import FastImage from 'react-native-fast-image';

const appVersionNumber = Config.routes.APP_VERSION_NUMBER;
const appVersionNumber_ANDROID = Config.routes.ANDROID_APP_VERSION_NUMBER;
const appVersionNumber_IOS = Config.routes.IOS_APP_VERSION_NUMBER;

class AuthNav extends Component {
  constructor(properties) {
    super(properties);
    this.state = {
      InvalidVersionModal: false,
      criticalUpdate: false,
      updateVersionNumber: Platform.OS === 'ios' ? appVersionNumber_IOS : appVersionNumber_ANDROID,
    };
  }

  componentDidMount() {
    // this.checkSession();
    this._subscribe = this.props.navigation.addListener('didFocus', () => {
      // this.checkAppIsAvailable()
      // this.checkAppVersion();
      this.checkAppUpdate();
    });
  }

  onIds(device) {
    if (device.userId) {
      Utils.setToken('DEVICE_ID', device.userId, function () {});
    }
  }

  async removeToken() {
    try {
      await AsyncStorage.removeItem('Whizzard:token');
      await AsyncStorage.removeItem('Whizzard:userId');
      this.props.navigation.navigate('Login');
      return true;
    } catch (exception) {
      return false;
    }
  }

  checkAppUpdate() {
    const self = this;
    const apiURL = Config.routes.BASE_URL + Config.routes.APP_UPDATE_NUMBER_WITHOUT_TOKEN;
    axios(apiURL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: {},
    })
      .then(function (response) {
        // console.log('check App update response======',response);
        if (response.status === 200) {
          let responseData = response.data;
          Utils.setToken('requireMockLocationCheck',JSON.stringify(responseData.requireMockLocationCheck),function () {});
          if(Platform.OS === 'ios'){
            if (responseData.iosAppVersion !== appVersionNumber_IOS) {
              self.setState({InvalidVersionModal: true,
                criticalUpdate:responseData.iosCriticalUpdate,
                updateVersionNumber:responseData.iosAppVersion})
            } else {
              self.checkSession();
            }
          }else {
            if (responseData.androidAppVersion !== appVersionNumber_ANDROID) {
              self.setState({InvalidVersionModal: true,
                // criticalUpdate:responseData.criticalUpdate,
                updateVersionNumber:responseData.androidAppVersion})
            } else {
              self.checkSession();
            }
          }
        }})
      .catch(function (error) {
        // console.log('check App update error', error, error.response);
        // self.props.navigation.navigate('Login');
        if (error.response) {
          if (error.response.status === 403) {
            Utils.dialogBox('Token Expired,Please Login Again', '');
            self.props.navigation.navigate('Login');
          } else {
            Utils.setToken(
              'Error_Message',
              error.response.data.message,
              function () {},
            );
            self.props.navigation.navigate('ErrorsList');
          }
        } else if (error.message) {
          Utils.setToken('Error_Message', error.message, function () {});
          self.props.navigation.navigate('ErrorsList');
        }else{
          Utils.setToken('Error_Message', error, function () {});
          self.props.navigation.navigate('ErrorsList');
        }
      });
  }

  checkSession() {
    AsyncStorage.getItem('Whizzard:token').then(accessToken => {
      if (accessToken) {
        AsyncStorage.getItem('Whizzard:userStatus').then(userStatus => {
          if (userStatus === 'ACTIVATION_PENDING' || userStatus === 'USER_PROFILE_PENDING') {
            this.props.navigation.navigate('ProfileStatusScreen');
          } else if (userStatus === 'REJECTED' || userStatus === 'DISABLED') {
            AsyncStorage.clear();
            this.props.navigation.navigate('RejectedUsers');
          } else {
            //ACTIVATED
            this.props.navigation.navigate('AppNav');
          }
        });
      } else {
        this.props.navigation.navigate('Login');
      }
    });
  }

  async getItem() {
    return await AsyncStorage.getItem('Whizzard:token');
  }

  async getDeviceId() {
    return await AsyncStorage.getItem('Whizzard:DEVICE_ID');
  }

  render() {
    const {criticalUpdate} = this.state;
    return (
      <View style={[Styles.flex1, Styles.alignCenter]}>
        <Image
          source={LoadImages.splash_screen}
          style={{
            height: Dimensions.get('window').height,
            width: Dimensions.get('window').width,
          }}
        />
        <View style={[Styles.alignCenter, {position: 'absolute'}]}>
          {LoadSVG.splash_icon}
          <Text
            style={[
              Styles.f18,
              Styles.cWhite,
              Styles.ffMbold,
              Styles.mTop30,
              Styles.mBtm10,
            ]}>
            Welcome to
          </Text>
          {LoadSVG.splash_logo}
          {/* MODAL FOR Invalid VERSION Details ALERT */}
          <Modal
            transparent={true}
            visible={this.state.InvalidVersionModal}
            onRequestClose={() => {}}>
            <View
              style={[
                Styles.aitCenter,
                Styles.jCenter,
                {
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  top: 0,
                  bottom: 0,
                  flex: 1,
                },
              ]}>
              <View
                style={[
                  Styles.bw1,
                  Styles.bgLGrey,
                  Styles.aslCenter,
                  Styles.br10,
                  {width: Dimensions.get('window').width - 70},
                ]}>
                <Card>
                  <Card.Content>
                    <View style={[Styles.aslCenter, Styles.p5]}>
                      <FastImage
                        source={LoadImages.Loader}
                        style={[Styles.img50, Styles.aslCenter]}
                      />
                      <CText
                        cStyle={[
                          Styles.cBlk,
                          Styles.aslCenter,
                          Styles.f18,
                          Styles.ffMbold,
                        ]}>
                        Please Update Application to the latest Version
                      </CText>
                    </View>
                    <View>
                      <Button
                        style={[
                          Styles.aslCenter,
                          Styles.bgBlue,
                          Styles.padH25,
                          Styles.marV10,
                        ]}
                        mode="contained"
                        onPress={() => {
                          this.setState({InvalidVersionModal: true}, () => {
                            Linking.openURL(
                                Platform.OS === 'ios' ?
                                    'https://apps.apple.com/in/app/whizzard/id1663302684'
                                    :
                              'https://play.google.com/store/apps/details?id=com.whizzard&hl=en',
                            );
                          });
                        }}>
                        {/*UPDATE  v{Config.routes.APP_VERSION_NUMBER}*/}
                        UPDATE v{this.state.updateVersionNumber}
                      </Button>
                    </View>
                    {!criticalUpdate ? (
                      <View>
                        <Button
                          style={[
                            Styles.aslCenter,
                            Styles.padH25,
                            Styles.mBtm10,
                          ]}
                          mode="text"
                          onPress={() => {
                            this.setState({InvalidVersionModal: false}, () => {
                              this.checkSession();
                            });
                          }}>
                          Later
                        </Button>
                      </View>
                    ) : null}
                  </Card.Content>
                </Card>
              </View>
            </View>
          </Modal>

        </View>
      </View>
    );
  }
}

export default withNavigation(AuthNav);
