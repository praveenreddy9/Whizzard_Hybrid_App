import React from "react";
import {ScrollView, View, Text, Image, TouchableOpacity, Alert, Platform, Linking} from "react-native";
import {
    List,
    Card,
    Divider,
    DefaultTheme,
    Provider as PaperProvider
} from "react-native-paper";
import {SafeAreaView} from "react-navigation";
import Utils, {Styles} from './common'
import AsyncStorage from "@react-native-async-storage/async-storage";
import Config from "./common/Config";
import Services from "./common/Services";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Entypo from "react-native-vector-icons/Entypo";
import _ from "lodash";


class DrawerComponents extends React.Component {

    constructor() {
        super();
        this.state = { showUserLogButton: false,userRole:'',supervisorAccess:false};
    }

    componentDidMount() {
        const { navigation } = this.props;
        this.focusListener = navigation.addListener('didFocus', () => {
            this.checkUserRole();
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
        });
    }

    componentWillUnmount() {
        this.focusListener.remove();
    }

    checkUserRole() {
        AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
            let tempRole = JSON.parse(userRole);

             if (tempRole >= 27) {   //roles more than 27
                  this.setState({showUserLogButton: true,userRole:tempRole})
            } else {
                  this.setState({showUserLogButton: false,userRole:tempRole})
            }

            if (tempRole >=19 ) {   //roles more than 19
                this.setState({supervisorAccess: true})
            } else {
                this.setState({supervisorAccess: false})
            }
        })
    }

    errorHandling(error) {
        console.log("screen error", error, error.response);
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
        AsyncStorage.getItem('Whizzard:phoneNumber').then((phoneNumber) => {
            const logoutURL = Config.routes.BASE_URL + Config.routes.LOGOUT_MOBILE;
            const body = {userId: userId};
            // console.log('logout body', body);
            this.setState({spinnerBool: true}, () => {
                Services.AuthHTTPRequestForShiftFlow(logoutURL, 'PUT', body, function (response) {
                    if (response.status === 200) {
                        // console.log("logoutURL resp 200 inital");
                        Config.routes.SOCKET_URL.emit('requestToDisconnectData',{phoneNumber:JSON.parse(phoneNumber)})
                        // Config.routes.SOCKET_URL.emit('requestToDisconnectForOMSData',{phoneNumber:JSON.parse(phoneNumber)})
                        // console.log("logoutURL resp 200 after");
                        self.setState({spinnerBool: false})
                        self.removeToken();
                    }
                }, function (error) {
                    self.errorHandling(error)
                })
            })
        });
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
            await AsyncStorage.removeItem("Whizzard:phoneNumber");       //===>Homescreen phonenumber for socket
            // this.props.navigation.navigate('authNavigator');
            this.props.navigation.navigate('Login')
            return true;
        } catch (exception) {
            return false;
        }
    }

    handleLendMoney(){
        AsyncStorage.getItem('Whizzard:userId').then((userId) => {
            AsyncStorage.getItem('Whizzard:phoneNumber').then((phoneNumber) => {
                this.props.navigation.closeDrawer();
                let tempPhone = JSON.parse(phoneNumber);
                let tempUrl = "https://webapp.karmalife.ai/?distribution=whizz&details="+userId+"&phone="+tempPhone;
                // console.log('tempUrl=====>',tempUrl);
                Linking.openURL(tempUrl);
                // this.props.navigation.navigate('MyVouchers')
                // https://webapp.karmalife.ai/?distribution=whizz&details=<user_identifier>&phone=<10 digit mobile number>
            });
        });
    }



    render() {
        const {userRole} = this.state;
        return (
            <PaperProvider>
                <View style={[Styles.flex1,Styles.padV10]}>
                    <SafeAreaView style={[Styles.flex1]}
                                  forceInset={{top: "always", horizontal: "never"}}>
                        <TouchableOpacity onPress={() => {
                            this.props.navigation.toggleDrawer();
                        }}>
                            <Card.Title title="Menu"
                                        style={{height:50}}
                                        titleStyle={[Styles.ffMbold,Styles.f16,Styles.pLeft5]}
                                        left={() => <List.Icon icon="close" color={"#000"}/>}
                            />
                        </TouchableOpacity>
                        <Divider style={{height:0.5}}/>
                        <ScrollView style={[Styles.flex1]}>
                            <TouchableOpacity onPress={() => {
                                this.props.navigation.closeDrawer();
                                this.props.navigation.navigate('HomeScreen');
                            }}>
                                <Card.Title
                                    title="Home"
                                    style={{height:60}}
                                    titleStyle={[Styles.ffMbold,Styles.f16,Styles.pLeft5]}
                                    left={() => <List.Icon icon="home" color={"#000"}/>}
                                />
                            </TouchableOpacity>
                            <Divider style={{height:0.5}}/>
                            {
                                this.state.showUserLogButton === true
                                    ?
                                    <TouchableOpacity onPress={() => {
                                        this.props.navigation.closeDrawer();
                                        this.props.navigation.navigate('UserLogHistory');
                                    }}>
                                        <Card.Title
                                            title="Log Attendance"
                                            style={{height:60}}
                                            titleStyle={[Styles.ffMbold,Styles.f16,Styles.pLeft5]}
                                            left={() => <List.Icon icon="store-mall-directory" color={"#000"}/>}
                                            // right={() => <List.Icon icon="chevron-right" />}
                                        />
                                    </TouchableOpacity>
                                    :
                                    <TouchableOpacity onPress={() => {
                                        this.props.navigation.closeDrawer();
                                        // this.props.navigation.navigate('MyTrips')
                                        this.props.navigation.navigate('MyTrips', {shiftId:''})
                                    }}>
                                        <Card.Title
                                            title="My Trips"
                                            style={{height:60}}
                                            titleStyle={[Styles.ffMbold,Styles.f16,Styles.pLeft5]}
                                            leftStyle={[{paddingLeft:20}]}
                                            left={() => <Entypo name="colours" size={20} color={"#000"} />}
                                        />
                                    </TouchableOpacity>
                            }
                            <Divider style={{height:0.5}}/>
                            <TouchableOpacity onPress={() => {
                                this.props.navigation.navigate('CalendarShifts',{userId:''});
                                this.props.navigation.closeDrawer();
                            }}>
                                <Card.Title
                                    title="Calendar Shifts"
                                    style={{height:60}}
                                    titleStyle={[Styles.ffMbold,Styles.f16,Styles.pLeft5]}
                                    leftStyle={[{paddingLeft:20}]}
                                    left={() => <FontAwesome name="calendar" size={20} color={"#000" }/>}
                                />
                            </TouchableOpacity>
                            <Divider style={{height:0.5}}/>
                            <TouchableOpacity onPress={() => {
                                this.props.navigation.closeDrawer();
                                this.props.navigation.navigate('NewProfileScreen',
                                    {UserStatus: 'ACTIVATED', selectedProfileUserID: "",UserFlow: 'NORMAL',onFocusPendingItem:null})
                            }}>
                                <Card.Title
                                    title="Profile"
                                    style={{height:60}}
                                    titleStyle={[Styles.ffMbold,Styles.f16,Styles.pLeft5]}
                                    left={() => <List.Icon icon="person" color={"#000"}/>}
                                    // right={() => <List.Icon icon="chevron-right" />}
                                />
                            </TouchableOpacity>
                            {
                                this.state.supervisorAccess === true
                                    ?
                                    <View>
                                        <Divider style={{height:0.5}}/>
                                        {
                                            // userRole >= 27
                                            userRole >= 30 || userRole === 27
                                            ?
                                                <TouchableOpacity onPress={() => {
                                                    this.props.navigation.closeDrawer();
                                                    // this.props.navigation.navigate('ReimbursementExpenses');
                                                    this.props.navigation.navigate('ExpensesList');
                                                }}>
                                                    <Card.Title
                                                        // title="Reimbursement"
                                                        title="Add Expenses"
                                                        style={{height:60}}
                                                        titleStyle={[Styles.ffMbold,Styles.f16,Styles.pLeft5]}
                                                        leftStyle={[{paddingLeft:20}]}
                                                        left={() => <FontAwesome name="address-card" size={22} color={"#000" }/>}
                                                    />
                                                </TouchableOpacity>
                                                :
                                                null
                                        }

                                        <Divider style={{height:0.5}}/>
                                        <TouchableOpacity onPress={() => {
                                            this.props.navigation.closeDrawer();
                                            this.props.navigation.navigate('PendingUsersScreen')
                                        }}>
                                            <Card.Title
                                                title="Pending Users"
                                                style={{height:60}}
                                                titleStyle={[Styles.ffMbold,Styles.f16,Styles.pLeft5]}
                                                left={() => <List.Icon icon="accessibility" color={"#000"}/>}
                                                // right={() => <List.Icon icon="chevron-right" />}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    :
                                    <View>
                                        <Divider style={{height:0.5}}/>
                                        <TouchableOpacity onPress={() => {
                                            this.props.navigation.closeDrawer();
                                            this.props.navigation.navigate('MyPlans')
                                        }}>
                                            <Card.Title
                                                title="My Plans"
                                                style={{height:60}}
                                                titleStyle={[Styles.ffMbold,Styles.f16,Styles.pLeft5]}
                                                left={() => <List.Icon icon="local-parking" color={"#000"}/>}
                                                // right={() => <List.Icon icon="chevron-right" />}
                                            />
                                        </TouchableOpacity>
                                    </View>
                            }

                            <Divider style={{height:0.5}}/>
                            {/*<TouchableOpacity onPress={() => {*/}
                            {/*    this.props.navigation.closeDrawer();*/}
                            {/*    this.props.navigation.navigate('MyVouchers')*/}
                            {/*}}>*/}
                            {/*    <Card.Title*/}
                            {/*        title="My Vouchers"*/}
                            {/*        style={{height:60}}*/}
                            {/*        titleStyle={[Styles.ffMbold,Styles.f16,Styles.pLeft5]}*/}
                            {/*        left={() => <List.Icon icon="receipt" color={"#000"}/>}*/}
                            {/*        // right={() => <List.Icon icon="chevron-right" />}*/}
                            {/*    />*/}
                            {/*</TouchableOpacity>*/}

                            <TouchableOpacity onPress={() => {
                                this.handleLendMoney();
                            }}>
                                <Card.Title
                                    title={"Register for KarmaLife"}
                                    style={{height:60}}
                                    titleStyle={[Styles.ffMbold,Styles.f16,Styles.pLeft5]}
                                    left={() => <List.Icon icon="receipt" color={"#000"}/>}
                                    // right={() => <List.Icon icon="chevron-right" />}
                                />
                            </TouchableOpacity>

                            <Divider style={{height:0.5}}/>
                            <TouchableOpacity onPress={() => {
                                this.props.navigation.closeDrawer();
                                this.props.navigation.navigate('ReferAFriend');
                            }}>
                                <Card.Title
                                    title="Refer a Friend"
                                    style={{height:60}}
                                    titleStyle={[Styles.ffMbold,Styles.f16,Styles.pLeft5]}
                                    left={() => <List.Icon icon="share" color={"#000"}/>}
                                    // right={() => <List.Icon icon="chevron-right" />}
                                />
                            </TouchableOpacity>
                            <Divider style={{height:0.5}}/>
                            <TouchableOpacity onPress={() => {
                                this.props.navigation.closeDrawer();
                                this.props.navigation.navigate('ReferredList');
                            }}>
                                <Card.Title
                                    title="Referred List"
                                    style={{height:60}}
                                    titleStyle={[Styles.ffMbold,Styles.f16,Styles.pLeft5]}
                                    left={() => <List.Icon icon="list" color={"#000"}/>}
                                    // right={() => <List.Icon icon="chevron-right" />}
                                />
                            </TouchableOpacity>
                            <Divider style={{height:0.5}}/>
                            <TouchableOpacity onPress={() => {
                                this.props.navigation.closeDrawer();
                                this.props.navigation.navigate('Settings')
                            }}>
                                <Card.Title
                                    title="Settings"
                                    style={{height:60}}
                                    titleStyle={[Styles.ffMbold,Styles.f16,Styles.pLeft5]}
                                    left={() => <List.Icon icon="settings" color={"#000"}/>}
                                    // right={() => <List.Icon icon="chevron-right" />}
                                />
                            </TouchableOpacity>
                            <Divider style={{height:0.5}}/>
                        </ScrollView>
                    </SafeAreaView>
                    <View style={[Styles.aslCenter, {marginBottom: 40, marginTop: 25}]}>
                        <Image style={[{height: 40, width: 200,}]}
                               source={require("../assets/images/whizzard-inverted.png")}/>
                               <View style={[Styles.row,Styles.jSpaceArd]}>
                                   <Text style={[Styles.ffMblack, {color:Services.returnServerBasedColor()}, Styles.alignCenter, Styles.aslCenter,Styles.mTop10]}>v.{Platform.OS === 'ios' ? Config.routes.IOS_APP_VERSION_NUMBER : Config.routes.ANDROID_APP_VERSION_NUMBER}</Text>
                                   <TouchableOpacity onPress={() => Alert.alert('Are you sure you want to logout?', alert,
                                       [{text: 'Cancel'}, {
                                           text: 'OK', onPress: () => {
                                               this.userLogout()
                                           }
                                       }]
                                   )}>
                                       <Text style={[Styles.f16,Styles.ffMbold,Styles.colorBlue,Styles.alignCenter, Styles.aslCenter,Styles.mTop10]}>Logout</Text>
                                   </TouchableOpacity>
                               </View>
                    </View>
                    {Services.returnAPKdate()}
                </View>
            </PaperProvider>
        );
    }
}


export default DrawerComponents;
