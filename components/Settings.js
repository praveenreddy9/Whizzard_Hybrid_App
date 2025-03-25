import * as React from "react";
import {
    View,
    StyleSheet,
    Alert,
    NativeModules,
    Linking,
    Text,
    TouchableOpacity,
    BackHandler,
    Modal, Dimensions, ScrollView,TextInput
} from "react-native";
import {
    Appbar,
    List,
    Divider,
    DefaultTheme,
    Provider as PaperProvider,
    Title,
    RadioButton
} from "react-native-paper";
import Icon from 'react-native-vector-icons/dist/MaterialIcons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import OfflineNotice from './common/OfflineNotice';
import Utils from "./common/Utils";
import Config from "./common/Config";
import Services from "./common/Services";
import {CDismissButton, Styles} from "./common";
import _ from "lodash";


var LocationService = NativeModules.LocationService; //LOCATIONS SERIVCES CALL


export default class Settings extends React.Component {

    constructor(props) {
        super(props);
        this.state={
            showPolicy:false,showTerms:false,deleteUserAccountReasonModal:false,reasonToDeleteAccount:'',disableDeleteButton:true,diableErrorMessage:''
        }
    }

    componentDidMount() {
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
        });
    }

    // componentWillUnmount() {
    //     this.didFocus.remove();
    // }

    errorHandling(error) {
        const self = this;
        if (error.response) {
            if (error.response.status === 403) {
                self.setState({spinnerBool: false});
                Utils.dialogBox("Token Expired,Please Login Again", '');
                self.props.navigation.navigate('Login');
            }else {
                self.setState({spinnerBool: false});
                {
                    Services.returnErrorResponseDataMessage(error);
                }
            }
        } else {
            self.setState({spinnerBool: false});
            Utils.dialogBox(error.message, '');
        }
    }

    userLogout() {
        const self = this;
        AsyncStorage.getItem('Whizzard:userId').then((userId) => {
                const logoutURL = Config.routes.BASE_URL + Config.routes.LOGOUT_MOBILE;
                const body = {userId: userId};
                this.setState({spinnerBool: true}, () => {
                    Services.AuthHTTPRequestForShiftFlow(logoutURL, 'PUT', body, function (response) {
                        if (response.status === 200) {
                            self.setState({spinnerBool: false})
                            self.removeToken();
                        }
                    }, function (error) {
                        self.errorHandling(error)
                    })
                })
            });
    };


    async removeToken() {
        try {
            await AsyncStorage.removeItem("Whizzard:token");
            await AsyncStorage.removeItem("Whizzard:userId");
            await AsyncStorage.removeItem("Whizzard:shiftId");
            await AsyncStorage.removeItem("Whizzard:currentShiftStatus");
            await AsyncStorage.removeItem("Whizzard:locationStatus");
            await AsyncStorage.removeItem("Whizzard:userRole");
            await AsyncStorage.removeItem("Whizzard:userStatus");   //===>for canEditTextput check in profile
            await AsyncStorage.removeItem("Whizzard:selectedUserSiteDetails");   //===>TeamListing
            await AsyncStorage.removeItem("Whizzard:selectedSiteDetails"); //===>sitelisting
            await AsyncStorage.removeItem("Whizzard:profilePicUrl");       //===>profilePicUrl Authnav
            // this.props.navigation.navigate('authNavigator');
            this.props.navigation.navigate('Login')
            return true;
        } catch (exception) {
            return false;
        }
    }


    async removeUserData() {
        try {
            // await AsyncStorage.removeItem("Whizzard:token");
            // await AsyncStorage.removeItem("Whizzard:loginDetails");
            // await AsyncStorage.removeItem("Whizzard:userId");
            // await AsyncStorage.removeItem("Whizzard:shiftId");
            // await AsyncStorage.removeItem("Whizzard:currentShiftStatus");
            // await AsyncStorage.removeItem("Whizzard:locationStatus");
            // await AsyncStorage.removeItem("Whizzard:userRole");
            // await AsyncStorage.removeItem("Whizzard:userStatus");   //===>for canEditTextput check in profile
            // await AsyncStorage.removeItem("Whizzard:selectedUserSiteDetails");   //===>TeamListing
            // await AsyncStorage.removeItem("Whizzard:selectedSiteDetails"); //===>sitelisting
            // await AsyncStorage.removeItem("Whizzard:profilePicUrl");       //===>profilePicUrl Authnav

            await AsyncStorage.clear();
            this.props.navigation.navigate('Login')
            return true;
        } catch (exception) {
            return false;
        }
    }

    userDeleteAccount() {
        const self = this;
            const apiURL = Config.routes.BASE_URL + Config.routes.DELETE_SELF_ACCOUNT;
            const body = {'reason':self.state.reasonToDeleteAccount};
            this.setState({spinnerBool: true}, () => {
                Services.AuthHTTPRequestForShiftFlow(apiURL, 'DELETE', body, function (response) {
                    if (response.status === 200) {
                        const tempData = response.data;
                        if (tempData.accountDeleted){
                            // Utils.dialogBox(tempData.message,'');
                            self.setState({spinnerBool: false},()=>{
                                self.removeUserData()
                            })
                        }else {
                            self.setState({spinnerBool: false})
                        }
                    }
                }, function (error) {
                    self.errorHandling(error)
                })
            })
    };

    render() {
        return (
            <View style={styles.container}>
                <OfflineNotice/>
                <Appbar.Header style={styles.appbar}>
                    <Appbar.Action icon="menu" size={30} onPress={() => {
                        this.props.navigation.openDrawer();
                    }}/>
                    <Appbar.Content title="Settings"/>
                    <Appbar.Action
                        icon={() => (
                            <Icon
                                name="forum"
                                size={28}
                                color="black"
                            />
                        )}
                    />
                </Appbar.Header>
                <List.Section style={styles.section}>
                    <List.Item
                               title="Language (English)"
                               titleStyle={[Styles.ffMregular]}
                               left={() => <List.Icon icon="language"/>}
                               right={() => <List.Icon icon="chevron-right"/>}
                    />
                    <Divider/>
                    <List.Item
                               title="FAQs"
                               titleStyle={[Styles.ffMregular]}
                               left={() => <List.Icon icon="help"/>}
                               right={() => <List.Icon icon="chevron-right"/>}
                               onPress={() => this.props.navigation.navigate("Faqs")}
                    />
                    <Divider/>

                    <List.Item
                        title="Terms of use"
                        titleStyle={[Styles.ffMregular]}
                        left={() => <List.Icon icon="assignment"/>}
                        right={() => <List.Icon icon={this.state.showTerms ? "keyboard-arrow-down":"chevron-right"}/>}
                        // onPress={() => Linking.openURL(`https://docs.google.com/document/d/e/2PACX-1vQOmqz0IMPq5e4b5Nv36CXcaDuqWLym8kOpLIHvm45H4o7XV4A0OxYO96I-C2knR4TI4AUFJp_MXSdD/pub`)}
                        onPress={() =>this.setState({showTerms:!this.state.showTerms,showPolicy:false})}
                    />
                    {
                        this.state.showTerms
                            ?
                            <View style={[Styles.padH10,Styles.pBtm5]}>
                                <Text style={[Styles.f14,Styles.cBlk,Styles.ffMregular]}>Whizzard ("Website" or "Whizzard.in") is owned by Zipzap Logistics Private Limited. ('Whizzard' or 'we' or 'us'). In using the Whizzard.in service, you are deemed to have accepted the Terms and Conditions of the agreement listed below or as may be revised from time to time, which is, for an indefinite period and you understand and agree that you are bound by such terms till the time you access this website. We reserve the right to change these terms & conditions from time to time without any obligation to inform you and it is your responsibility to look through them as often as possible.</Text>
                                <TouchableOpacity activeOpacity={0.6}
                                                  onPress={() => {
                                                      // this.setState({showPolicy: !this.state.showPolicy})
                                                      Linking.openURL('https://whizzard.in/terms')
                                                      // Linking.openURL('https://docs.google.com/document/d/1tOv7x7VKCVqk10vgeQaAbZV9q_VkIYEBnFlQIu1mKnQ/edit?usp=sharing')
                                                  }}
                                                  style={[ {width:100},  Styles.m5, ]}>
                                    <Text
                                        style={[Styles.ffMbold,Styles.colorOrangeYellow]}>READ MORE</Text>
                                </TouchableOpacity>
                            </View>
                            :
                            null
                    }
                    <Divider/>

                    <List.Item
                        title="Privacy policy"
                        titleStyle={[Styles.ffMregular]}
                        left={() => <List.Icon icon="security"/>}
                        right={() => <List.Icon icon={this.state.showPolicy ? "keyboard-arrow-down":"chevron-right"}/>}
                        // onPress={() => Linking.openURL(`https://docs.google.com/document/d/e/2PACX-1vQOmqz0IMPq5e4b5Nv36CXcaDuqWLym8kOpLIHvm45H4o7XV4A0OxYO96I-C2knR4TI4AUFJp_MXSdD/pub`)}
                        // onPress={() =>this.props.navigation.navigate('Privacy')}
                        onPress={() =>this.setState({showPolicy:!this.state.showPolicy,showTerms:false})}
                    />
                    {
                        this.state.showPolicy
                        ?
                            <View style={[Styles.padH10,Styles.pBtm5]}>
                                <Text style={[Styles.f14,Styles.cBlk,Styles.ffMregular]}>We at Zipzap Logistics Private Limited (“Whizzard”) consider customer trust as our top priority. We deliver services to millions of customers across the country. Our customers trust us with some of their most sensitive information. This policy informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Services and the choices you have associated with that data.</Text>
                                <TouchableOpacity activeOpacity={0.6}
                                                  onPress={() => {
                                                      // this.setState({showPolicy: !this.state.showPolicy})
                                                      // Linking.openURL('https://whizzard.in/privacypolicy')
                                                      Linking.openURL('https://privacy.whizzard.in/')
                                                      // Linking.openURL('https://docs.google.com/document/d/1E6u2zH8ebvDzBMUxNY5Rh8YmxtXjGvG8pJV7enQyBRc/edit?usp=sharing')
                                                  }}
                                                  style={[ {width:100},  Styles.marV5, ]}>
                                    <Text
                                        style={[Styles.ffMbold,Styles.colorOrangeYellow]}>READ MORE</Text>
                                </TouchableOpacity>
                            </View>
                            :
                            null
                    }
                    <Divider/>

                    <List.Item
                               onPress={() => Alert.alert('Are you sure you want to logout?', alert,
                                   [{text: 'Cancel'}, {
                                       text: 'OK', onPress: () => {
                                           this.userLogout()
                                       }
                                   }]
                               )}
                               title="Logout"
                               titleStyle={[Styles.ffMregular]}
                               left={() => <List.Icon icon="exit-to-app"/>}
                        // right={() => <List.Icon icon="chevron-right" />}
                    />
                    <Divider/>

                    <Divider/>
                </List.Section>

                <List.Section style={[Styles.flex1,Styles.alignEnd,Styles.mBtm30]}>
                <List.Item
                    style={[Styles.alignCenterBtm,Styles.bgWhite,]}
                    onPress = {()=>{this.setState({deleteUserAccountReasonModal:true,disableDeleteButton:true,diableErrorMessage:'',reasonToDeleteAccount:''})}}
                    title="Delete Account"
                    titleStyle={[Styles.cRed,Styles.aslCenter]}
                    // left={() => <List.Icon icon="exit-to-app"/>}
                    // right={() => <List.Icon icon="chevron-right" />}
                />
                </List.Section>


                {/*MODAL to delete the account with reason*/}
                <Modal
                    transparent={true}
                    visible={this.state.deleteUserAccountReasonModal}
                    onRequestClose={() => {
                        this.setState({deleteUserAccountReasonModal: false})
                    }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View style={[Styles.bgWhite, Styles.br15, Styles.mBtm30, {
                            width: Dimensions.get('window').width - 60,
                            height:Dimensions.get('window').height/2.1,
                        }]}>

                            <View style={[Styles.p15,Styles.aslCenter]}>
                                <Title style={[Styles.ffMbold, Styles.f20, Styles.aslStart,Styles.colorBlue]}>Are you sure you want to delete your account?</Title>
                                <Text style={[Styles.cAsh,Styles.f16]}>Once Deleted, you would lose access to this account</Text>
                            </View>
                            <View style={[Styles.pBtm10]}>
                                <View style={[Styles.mBtm10]}>
                                    <TextInput
                                        multiline={true}
                                        numberOfLines={8}
                                        style={[Styles.bgWhite, Styles.f16, Styles.bw1, Styles.bcGrey, Styles.marH15,Styles.p5, {height: 140}]}
                                        placeholderTextColor={'#b2beb5'}
                                        placeholder='Enter Reason to Delete Account'
                                        value={this.state.reasonToDeleteAccount}
                                        onChangeText={(reasonToDeleteAccount) => this.setState({reasonToDeleteAccount},()=>{
                                            if (this.state.reasonToDeleteAccount){
                                                let resp ={}
                                                resp = Utils.isValidReason(this.state.reasonToDeleteAccount);
                                                if (resp.status){
                                                    this.setState({disableDeleteButton:false,diableErrorMessage:''})
                                                }else {
                                                    this.setState({disableDeleteButton:true,diableErrorMessage:resp.message})
                                                }
                                            }else {
                                                this.setState({disableDeleteButton:true,diableErrorMessage:''})
                                            }
                                        })}
                                    />
                                    {
                                        this.state.diableErrorMessage ?
                                            <Text style={[Styles.cRed,Styles.ffMregular,Styles.pLeft20,Styles.mTop3]}>{this.state.diableErrorMessage}</Text>
                                            :
                                            <Text style={[Styles.cWhite,Styles.ffMregular,Styles.pLeft20,Styles.mTop3]}>Delete</Text>
                                    }
                                </View>
                                <View style={[Styles.row, Styles.jSpaceArd, Styles.p10]}>
                                    <TouchableOpacity onPress={() => this.setState({deleteUserAccountReasonModal: false})}
                                                      style={[Styles.aslCenter, Styles.br10, {backgroundColor: '#e3e3e3'}]}>
                                        <Text
                                            style={[Styles.ffMbold, Styles.aslCenter, Styles.padH10, Styles.padV10, Styles.f16,]}>CANCEL</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity disabled={this.state.disableDeleteButton}
                                                      onPress={()=>{this.userDeleteAccount()}}
                                                      style={[Styles.aslCenter, Styles.br10,this.state.disableDeleteButton ? Styles.bgDisabled : Styles.bgDarkRed]}>
                                        <Text
                                            style={[Styles.ffMbold, Styles.cWhite, Styles.aslCenter, Styles.padH10, Styles.padV10, Styles.f16,]}>DELETE</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>


                        </View>
                    </View>
                </Modal>
            </View>
        );
    }
};

const styles = StyleSheet.create({
    appbar: {
        backgroundColor: "white"
    },
    section: {
        backgroundColor: "white",
        fontSize: 30
    },
    container: {
        flex: 1,
        backgroundColor: "#f1f5f4"
    }
});
