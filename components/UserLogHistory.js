import React, {Component} from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Modal, Dimensions, ScrollView, Alert, Button, DatePickerAndroid, Platform
} from "react-native";
import {Appbar, Card, Colors, DefaultTheme, List} from "react-native-paper";
import Config from "./common/Config";
import Services from "./common/Services";
import Utils from "./common/Utils";
import {CSpinner, CText, LoadSVG, Styles} from "./common";
import OfflineNotice from './common/OfflineNotice';
import {Row, Column as Col} from "react-native-flexbox-grid";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {Picker} from '@react-native-picker/picker';
  import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import Fontisto from "react-native-vector-icons/dist/Fontisto";
import _ from 'lodash';
import RNDateTimePicker from "react-native-date-picker";

export class UserLogHistory extends Component {
    constructor(props) {
        super(props);
        this.state = {
            usersLogList: [],
            page: 1,
            spinnerBool: false,
            size: 10,
            isLoading: false,
            isRefreshing: false,
            logAttendanceDataModal: false,filtersModal:false,searchActive:false,
            filterFromDate:Services.returnCalendarFormat(new Date()),filterToDate :Services.returnCalendarFormat(new Date()),
            // attendenceTypes: [
            //     {value: '', label: 'Attendence Type', key: 0},
            //     {value: 'Scan QR Code', label: 'Scan QR Code', key: 1},
            //     {value: 'Working remotely', label: 'Working remotely', key: 2},
            //     {value: 'Day off', label: 'Day off', key: 3},
            //     ],
            attendenceSelected:'',userLogStatus:[],attendenceTypes:[],userLogStatusModal:false,
            sitesList:[],rolesList:[],logTypeList:[],filterLogStatus:'',myLogCount:[],totalDayDuration:'',
            showSelfBoard:false,
            userLogStatusDetails:[],selectedLogType:'',selectedLogValue:'',
            selfCheckboxEnabled:true,leadRoleAccess:false
        };
    }


    componentDidMount() {
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            AsyncStorage.getItem('Whizzard:switchState').then((switchState) => {
                AsyncStorage.getItem('Whizzard:userId').then((userId) => {
                    AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {

                        let tempAccessRole =  userRole === '28' || userRole === '45' || userRole === '47' || userRole === '70'
                            || userRole === '72' || userRole === '74' || userRole === '76' || userRole === '78' || userRole === '80'
                        this.setState({page:1,switchState: JSON.parse(switchState),
                            leadRoleAccess:tempAccessRole,
                            loggedUserId:userId,filterUserId:userId,
                            // logTab: 'SiteLogs',
                            logTab: 'DashBoard',
                            searchActive:false,filterSiteId:'', filterRoleId:'', filterLogStatus:'',
                            filterFromDate:Services.returnCalendarFormat(new Date()),filterToDate :Services.returnCalendarFormat(new Date())},()=>{

                            // this.getRolesForEmpAttendanceFilter()  //to use roles list at filters
                            // this.getLoggedUserSites()     //to use sites list at filters
                            // this.getLogTypes()           //to use log types at filters

                            // this.getLogHistory()      //to get logs list of all users
                            this.getUserLogStatus()   //to check logged or not
                        })
                    })
                })
            })
            Services.checkMockLocationPermission((response) => {
                if (response){
                    this.props.navigation.navigate('Login')
                }
            })
        });
    }

    componentWillUnmount() {
        // this.didFocus.remove();
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

    errorHandling(error) {
        // console.log("log attendance report error", error, error.response);
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

    getLoggedUserSites() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_LOGGED_USER_SITES;
        const body = {
            businessUnits: [],
            cityIds: [],
            regionIds: [],
            states: [],
            // page: self.state.page,
            // size: 15
        };
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequestForShiftFlow(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    let tempResponse = response.data
                    tempResponse.push({id:'',siteLable:'All'})
                    tempResponse.unshift(tempResponse.pop());
                    self.setState({
                        sitesList:tempResponse,
                        spinnerBool: false
                    })
                }
            }, function (error) {
                self.errorHandling(error)
            })
        })
    };

    getRolesForEmpAttendanceFilter() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_ROLES_LIST_LOG_ATTENDANCE;
        const body = {};
        this.setState({spinnerBool: true,rolesList:[]}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    let tempResponse =[]
                    tempResponse = response.data
                    tempResponse.push({value:'',key:'All'})
                    tempResponse.unshift(tempResponse.pop());
                    self.setState({
                        rolesList:  tempResponse,
                        spinnerBool: false
                    })
                    self.getLoggedUserSites()     //to use sites list at filters
                }
            }, function (error) {
                self.errorHandling(error)
            })
        })
    };

    getLogTypes() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_USER_LOG_STATUS;
        const body = {};
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    const tempData = response.data
                    let tempResponse = tempData.logTypes
                    tempResponse.push({value:'',name:'All'})
                    tempResponse.unshift(tempResponse.pop());
                    self.setState({logTypeList:tempResponse,spinnerBool:false})
                }
                self.getRolesForEmpAttendanceFilter()  //to use roles list at filters
            }, function (error) {
                self.errorHandling(error)
            })
        })
    };


    fetchTotalDayDuration(logResp) {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.TO_FETCH_USER_DAY_DURATION+ logResp.userId + '/'+ logResp.dateStr ;
        const body = {};
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    // console.log('day duration===',response.data,apiUrl);
                    self.setState({totalDayDuration:response.data,spinnerBool:false})
                }
            }, function (error) {
                self.errorHandling(error)
            })
        })
    };




    getUserLogStatus() {
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_USER_LOG_STATUS;
        const body = {};
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequest(apiUrl, 'GET', body, function (response) {
                if (response.status === 200) {
                    const tempData = response.data
                    const sampleLogType = tempData.logTypes

                    // if (tempData.status === null && tempData.showQRCode){
                    self.setState({userLogStatusDetails:response.data,
                        // userLogStatusModal:true,
                        attendenceTypes:sampleLogType,spinnerBool:false,
                        selectedLogType:tempData.status,selectedLogValue:tempData.status,
                    },()=>{
                        self.getLogHistory()
                    })
                    // }else {
                    //     self.setState({spinnerBool: false ,
                    //         userLogStatusDetails:response.data,
                    //         userLogStatus :tempData,attendenceTypes:sampleLogType
                    //     })
                    // }

                }
            }, function (error) {
                self.errorHandling(error)
            })
        })
    };

    //API CALL to update user log status
    updateUserLogStatus(StatusKey,statusType){
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.USER_ATTENDENCE_LOG
        const body = {logStatus: StatusKey,statusType:statusType};
        self.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequestForShiftFlow(apiUrl, "POST", body, function (response) {
                if (response.status === 200) {
                    self.setState({spinnerBool: false,userLogStatusModal:false})
                    Utils.dialogBox(response.data.message, '');
                    self.getUserLogStatus()
                    // self.getLogHistory()
                }
            }, function (error) {
                self.errorHandling(error)
            })
        });
    };

    getLogHistory() {
        const {usersLogList, page,logTab,selfCheckboxEnabled} = this.state;
        this.setState({isLoading: true});
        const self = this;
        const apiUrl = Config.routes.BASE_URL + Config.routes.GET_USER_LOG_HISTORY;
        const body = {
            adminIds: [],
            businessUnits: [],
            // byNoLogOut: false,
            cityIds: [],
            // endDate: Services.returnCalendarFormat(new Date()),
            endDate:Services.returnCalendarFormat(self.state.filterToDate) ,
            roles: self.state.filterRoleId ? [self.state.filterRoleId]:[],
            siteIds: self.state.filterSiteId ? [self.state.filterSiteId]:[],
            // startDate: logTab === 'SiteLogs' ? Services.returnCalendarFormat(new Date()) : "2021-01-01",
            startDate:Services.returnCalendarFormat(self.state.filterFromDate),
            states: [],
            // userIds:logTab === 'SiteLogs' ?[] : [this.state.filterUserId],
            userIds:(logTab === 'DashBoard' || selfCheckboxEnabled ) ? [this.state.loggedUserId] : [],
            // userIds:[this.state.loggedUserId],
            // userIds:this.state.filterUserId,
            status:self.state.filterLogStatus,
            page: self.state.page,
            size: 15
        };
        this.setState({spinnerBool: true,attendenceSelected:''}, () => {
            Services.AuthHTTPRequestForShiftFlow(apiUrl, 'POST', body, function (response) {
                if (response.status === 200) {
                    // console.log("log history resp200",response.data);
                    let siteLogs = response.data.userAttendanceLogDTOPage
                    let myLogs = response.data.logsCount
                    let tempFirstLog = siteLogs.content[0] ? siteLogs.content[0] : []
                    self.setState({
                        usersLogList: page === 1 ? siteLogs.content : [...usersLogList, ...siteLogs.content],
                        totalPages: siteLogs.totalPages,
                        myLogCount:myLogs,
                        isRefreshing: false,
                        spinnerBool: false,
                        filtersModal:false,
                        boardFirstLog: tempFirstLog
                    },()=>{
                        (logTab === 'DashBoard' && tempFirstLog ) ? self.fetchTotalDayDuration(tempFirstLog) : null
                    })
                }
            }, function (error) {
                self.errorHandling(error)
            })
        })
    };

    handleLoadMore = () => {
        this.state.page < this.state.totalPages ?
            this.setState({
                page: this.state.page + 1
            }, () => {
                this.getLogHistory();
            })
            :
            null
    };

    renderFooter = () => {
        return (
            this.state.page < this.state.totalPages ?
                <View>
                    <ActivityIndicator animating size="large"/>
                </View> :
                null
        );
    };
    handleRefresh = () => {
        this.setState({
            isRefreshing: true, page: 1
        }, () => {
            this.getLogHistory();
        });
    };

    onTabChange(logTab){
        this.setState({
            logTab:logTab,
            filterFromDate:Services.returnCalendarFormat(new Date()),
            filterToDate :Services.returnCalendarFormat(new Date()),
            filterSiteId:'',
            filterRoleId:'',
            filterLogStatus:'',
            searchActive:false,usersLogList:[],page :1},()=>{
            this.getUserLogStatus()
            // this.getLogHistory();
        })
    }

    setDateTimePicker = (event, date) => {
        const {filterDate} = this.state;
        let selectedTimestamp = event.nativeEvent.timestamp
        let tempDate = new Date(selectedTimestamp)
        let shiftDate = new Date()
        shiftDate = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate())

        if (filterDate === 'filterToDate'){
            var filterToDate = Services.returnCalendarFormat(tempDate);
            var filterFromDate = Services.returnCalendarFormat(this.state.filterFromDate);

            if(filterFromDate <= filterToDate){
                this.setState({filterToDate: shiftDate,showDateTimepicker:false});
            }else{
                Utils.dialogBox('Selected Date is less than from date','')
            }
        }else {
            this.setState({filterFromDate: shiftDate,filterToDate: shiftDate,showDateTimepicker:false});
        }
    };

    validateDateSelection=(date)=>{
        const {filterDate} = this.state;
        let tempDate = new Date(date)
        let shiftDate = new Date()
        shiftDate = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate())

        if (filterDate === 'filterToDate'){
            var filterToDate = Services.returnCalendarFormat(tempDate);
            var filterFromDate = Services.returnCalendarFormat(this.state.filterFromDate);

            if(filterFromDate <= filterToDate){
                this.setState({filterToDate: shiftDate,showDateTimepicker:false});
            }else{
                Utils.dialogBox('Selected Date is less than from date','')
            }
        }else {
            this.setState({filterFromDate: shiftDate,filterToDate: shiftDate,showDateTimepicker:false});
        }
    }


    returnDashBoardView(){
        const {usersLogList, isRefreshing,logTab,myLogCount,logAttendanceData,holidaysList,
            showSelfBoard,userLogStatusDetails,selectedLogType,selectedLogValue} = this.state;
        return(
            <View style={{flex: 1, alignItems: 'center', backgroundColor: '#dcdcdc', paddingBottom: 15}}>

                {/*<View style={[Styles.flex1]}></View>*/}
                <View style={[Styles.alignCenter,{height:Dimensions.get('window').height/2.5}]}>

                    {
                        // !selectedLogValue && !selectedLogType
                        userLogStatusDetails.status === null && !selectedLogValue
                            // userLogStatusDetails.enableLogSelection
                            ?
                            <TouchableOpacity
                                onPress={() => {
                                    // this.getUserLogStatus()
                                    this.setState({userLogStatusModal:true})
                                }}
                                activeOpacity={0.7}
                                style={[Styles.alignCenter, Styles.m10, Styles.padV15, Styles.br5, Styles.bgBlk, Styles.padH5]}>
                                <Text
                                    style={[Styles.f16, Styles.aslCenter, Styles.marH10, Styles.cWhite, Styles.ffMbold]}>{selectedLogValue ? 'Change' : 'Select'} Today's
                                    Attendance</Text>
                            </TouchableOpacity>
                            : null
                    }


                    {
                        selectedLogValue && selectedLogType !== "SCAN_QR_CODE"
                            ?
                            <Text
                                style={[Styles.cRedBlack, Styles.ffMbold, Styles.f18,Styles.mTop10]}>{_.startCase(selectedLogValue)}</Text>
                            :
                            null
                    }

                    {
                        selectedLogType === "SCAN_QR_CODE"
                            ?
                            <View style={[Styles.row,Styles.marV20]}>
                                <TouchableOpacity
                                    onPress={()=>{this.props.navigation.navigate('ScanQRcode', {UserFlow: 'UserAttendanceLog'});}}
                                    activeOpacity={0.7}
                                    style={[Styles.aslCenter, Styles.padV15, Styles.br5,Styles.bgBlk,Styles.padH10,Styles.row]}>
                                    <FontAwesome name="qrcode" size={28} color={'#fff'}/>
                                    <Text
                                        style={[Styles.f16, Styles.aslCenter, Styles.marH10, Styles.cWhite, Styles.ffMbold]}>Scan QR Code</Text>
                                </TouchableOpacity>
                            </View>
                            :
                            selectedLogType === "WORKING_REMOTELY" && !userLogStatusDetails.workingRemotelyCompleted
                                ?
                                <View style={[Styles.row,Styles.marV20]}>
                                    <TouchableOpacity
                                        onPress={()=>{this.updateUserLogStatus(selectedLogType,'IN')}}
                                        activeOpacity={0.7}
                                        style={[Styles.aslCenter,Styles.p3,Styles.mRt30,userLogStatusDetails.status === "WORKING_REMOTELY" && !userLogStatusDetails.workingRemotelyCompleted ? Styles.bgDisabled : Styles.bgGrn,Styles.br3,Styles.OrdersScreenCardshadow]}
                                        disabled={userLogStatusDetails.status === "WORKING_REMOTELY" && !userLogStatusDetails.workingRemotelyCompleted }>
                                        <View style={[Styles.row,Styles.padH5]}>
                                            <MaterialIcons name="laptop" size={28} color="black" />
                                            <Text style={[Styles.ffMbold,Styles.f18,Styles.pLeft10,Styles.pRight5]}>Start</Text>
                                        </View>
                                    </TouchableOpacity>

                                    {
                                        userLogStatusDetails.status
                                            ?
                                            <TouchableOpacity
                                                onPress={() => {
                                                    this.updateUserLogStatus(selectedLogType, 'OUT')
                                                }}
                                                disabled={userLogStatusDetails.status === "WORKING_REMOTELY" && !userLogStatusDetails.status}
                                                activeOpacity={0.7}
                                                style={[Styles.aslCenter, Styles.bgDarkRed, Styles.p3, Styles.mLt30,Styles.br3,Styles.OrdersScreenCardshadow]}>
                                                <View style={[Styles.row,Styles.padH5]}>
                                                    <MaterialIcons name="timer-off" size={28} color="black" />
                                                    <Text
                                                        style={[Styles.ffMbold, Styles.f18, Styles.pLeft10, Styles.pRight5]}>Stop</Text>
                                                </View>
                                            </TouchableOpacity>
                                            :
                                            null
                                    }
                                </View>
                                :
                                selectedLogType === "ON_LEAVE" || selectedLogType === "PRIVILEGE_LEAVE" || selectedLogType === "EXIGENCY_LEAVE" || selectedLogType === "COMPENSATION_LEAVE"
                                    ?
                                    // <TouchableOpacity
                                    //     onPress={()=>{this.updateUserLogStatus(selectedLogType,'')}}
                                    //     activeOpacity={0.7}
                                    //     style={[Styles.aslCenter,Styles.bgGrn,Styles.p5,Styles.mTop20]}>
                                    //     <Text style={[Styles.ffMbold,Styles.f20,Styles.pLeft10,Styles.pRight5,Styles.cWhite]}>Confirm Leave</Text>
                                    // </TouchableOpacity>
                                    null
                                    :
                                    null
                    }

                    {
                        // selectedLogValue && selectedLogType
                        userLogStatusDetails.enableLogSelection && userLogStatusDetails.status
                            ?
                            <TouchableOpacity
                                onPress={()=>{
                                    // this.getUserLogStatus()
                                    this.setState({userLogStatusModal:true})
                                }
                                }
                                activeOpacity={0.7}
                                style={[Styles.mTop10]}>
                                <Text
                                    style={[Styles.cOrange, Styles.ffMregular, Styles.f18,Styles.mTop10,{borderBottomWidth:2,borderBottomColor:'#F2994A'}]}>Do you want to change the log type ?</Text>
                            </TouchableOpacity>
                            :
                            null
                    }

                </View>


                {
                    usersLogList.length > 0 && (usersLogList[0].logStatus === "SCAN_QR_CODE" || usersLogList[0].logStatus === "WORKING_REMOTELY")
                        ?
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                                this.fetchTotalDayDuration(this.state.boardFirstLog)
                            }}
                            disabled={true}
                            style={[Styles.p5, Styles.row,Styles.mTop10]}>
                            <Text style={[Styles.ffMbold, Styles.colorBlue, Styles.pTop3]}>Total Duration:</Text>
                            <Text
                                style={[Styles.ffMbold, Styles.f18, Styles.txtAlignCen, {color: '#8b3363'}]}> {this.state.totalDayDuration || '--'}</Text>
                            {/*<View style={[Styles.bgLPink, Styles.row, Styles.marH5, Styles.aslCenter]}>*/}
                            {/*    <Text>Fetch</Text>*/}
                            {/*    <FontAwesome name="refresh" size={20} color="black" style={[Styles.padH10]}/>*/}
                            {/*</View>*/}
                        </TouchableOpacity>
                        :
                        null
                }



                <ScrollView persistentScrollbar={true}>
                    {
                        usersLogList.length > 0
                            ?
                            <View style={[{width:Dimensions.get('window').width - 20},Styles.bw1,Styles.bcAsh]}>
                                {
                                    usersLogList.map((logAttendanceData, index) => {
                                        return (
                                            <TouchableOpacity
                                                activeOpacity={0.7}
                                                onPress={()=>{this.setState({logAttendanceData, logAttendanceDataModal: true})}}
                                                style={[Styles.bgRed, Styles.marV5, Styles.bgWhite, Styles.OrdersScreenCardshadow, Styles.padH5, Styles.marH5]}>
                                                <View key={index} style={[Styles.p5, Styles.aslCenter, Styles.row]}>
                                                    <Text
                                                        style={[Styles.ffMbold, Styles.cDarkRed, Styles.f20]}>{logAttendanceData.status || '--'}</Text>
                                                    {
                                                        logAttendanceData.logStatus === "SCAN_QR_CODE"
                                                            ?
                                                            <Text
                                                                style={[Styles.ffMbold, Styles.colorBlue, Styles.f18]}> ({logAttendanceData.attrs.siteCode || '--'})</Text>
                                                            :
                                                            null
                                                    }
                                                </View>

                                                {
                                                    logAttendanceData.requestedAttStatus
                                                        ?
                                                        <View style={[Styles.p5]}><Text
                                                            style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                            style={[Styles.ffMbold, Styles.colorBlue]}>Approval
                                                            Status:</Text> {Services.returnLogAttendanceStatusText(logAttendanceData.requestedAttStatus)}
                                                        </Text></View>
                                                        :
                                                        null
                                                }
                                                {
                                                    logAttendanceData.requestApprovalFrom
                                                        ?
                                                        <View style={[Styles.p5]}><Text
                                                            style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                            style={[Styles.ffMbold, Styles.colorBlue]}>Action By:</Text> {logAttendanceData.requestApprovalFrom || '--'}
                                                        </Text></View>
                                                        :
                                                        null
                                                }
                                                {
                                                    logAttendanceData.approvedAt
                                                        ?
                                                        <View style={[Styles.p5]}><Text
                                                            style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                            style={[Styles.ffMbold, Styles.colorBlue]}>Action Time:</Text> {Services.convertDateintoGeneralFormatWithTime(logAttendanceData.approvedAt) || '--'}
                                                        </Text></View>
                                                        :
                                                        null
                                                }
                                                {
                                                    logAttendanceData.logStatus === "SCAN_QR_CODE" || logAttendanceData.logStatus === "WORKING_REMOTELY"
                                                        ?
                                                        <View style={[Styles.row, Styles.jSpaceBet]}>
                                                            <View style={[Styles.p5, Styles.row]}>
                                                                <Text
                                                                    style={[Styles.ffMbold, Styles.colorBlue, Styles.pTop3]}>IN:</Text>
                                                                <Text
                                                                    style={[Styles.ffMbold, Styles.f18, Styles.txtAlignCen]}> {logAttendanceData.inTime ? Services.convertTimeStamptoBlueColorHMforAttendance(logAttendanceData.inTime, Styles.colorGreen) : '--'}</Text>
                                                            </View>
                                                            <View style={[Styles.p5, Styles.row]}>
                                                                <Text
                                                                    style={[Styles.ffMbold, Styles.colorBlue, Styles.pTop3]}>OUT:</Text>
                                                                <Text
                                                                    style={[Styles.ffMbold, Styles.f18, Styles.txtAlignCen]}> {logAttendanceData.outTime ? Services.convertTimeStamptoBlueColorHMforAttendance(logAttendanceData.outTime, Styles.cDarkRed) : '--'}</Text>
                                                            </View>
                                                        </View>
                                                        :
                                                        null
                                                }

                                                {
                                                    logAttendanceData.logStatus === "SCAN_QR_CODE" || logAttendanceData.logStatus === "WORKING_REMOTELY"
                                                        ?
                                                        <View style={[Styles.p5, Styles.row]}>
                                                            <Text
                                                                style={[Styles.ffMbold, Styles.colorBlue, Styles.pTop3]}>Duration:</Text>
                                                            <Text
                                                                style={[Styles.ffMbold, Styles.f18, Styles.txtAlignCen, {color: '#8b3363'}]}> {logAttendanceData.outTime ? logAttendanceData.attrs.duration || '--' : '--'}</Text>
                                                        </View>
                                                        :
                                                        null
                                                }

                                            </TouchableOpacity>
                                        )
                                    })
                                }
                            </View>
                            :
                            null
                    }
                </ScrollView>
            </View>
        )
    }


    render() {
        const {usersLogList, isRefreshing,logTab,myLogCount,logAttendanceData,
            showSelfBoard,userLogStatusDetails,selectedLogType,selectedLogValue,selfCheckboxEnabled,leadRoleAccess} = this.state;
        return (
            <View style={styles.container}>
                {this.renderSpinner()}
                <OfflineNotice/>
                <Appbar.Header style={[Styles.bgDarkRed]}>
                    {/*<Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>*/}
                    <Appbar.Action icon="menu" size={30} onPress={() => {
                        this.props.navigation.openDrawer();
                    }}/>
                    <Appbar.Content title="Log Attendance"/>
                    {
                        logTab !== 'DashBoard'
                            ?
                            <View style={[Styles.row, Styles.aslCenter, Styles.mRt30]}>
                                <FontAwesome name="filter" size={30} color={'#3AAAF6'} style={[Styles.jEnd]}
                                             onPress={() => {
                                                 this.setState({filtersModal: true}, () => {
                                                     this.getLogTypes()           //to use log types at filters
                                                 })
                                             }}/>
                                {
                                    this.state.searchActive
                                        ?
                                        <TouchableOpacity style={[Styles.aslCenter, Styles.mLt5]}
                                                          onPress={() => {
                                                              this.onTabChange(logTab)
                                                          }}>
                                            <Text
                                                style={[Styles.cBlk, Styles.f14, {borderBottomWidth: 1}]}>(Reset)</Text>
                                        </TouchableOpacity>
                                        :
                                        null
                                }
                            </View>
                            :
                            null
                    }
                </Appbar.Header>
                {this.renderSpinner()}
                {
                    showSelfBoard
                        ?
                        this.returnDashBoardView()
                        :
                        <View style={{flex: 1, alignItems: 'center', backgroundColor: '#dcdcdc', paddingBottom: 30}}>

                            {/* TABS FOR MY LOGS,SITE LOGS */}
                            <View style={[Styles.row]}>
                                <View style={[Styles.row, Styles.m10, Styles.jSpaceArd, Styles.OrdersScreenCardshadow]}>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            this.setState({filterUserId: this.state.loggedUserId}, () => {
                                                this.onTabChange('DashBoard')
                                            })
                                        }}
                                        style={[Styles.aitCenter, Styles.padH10,
                                            logTab === 'DashBoard' ? Styles.bgDarkRed : Styles.bgWhite
                                        ]}>
                                        <Text
                                            style={[Styles.f18, Styles.p5, Styles.ffMbold, logTab === 'DashBoard' ? Styles.cWhite : Styles.cBlk]}>Attendance</Text>
                                    </TouchableOpacity>
                                    {/*<TouchableOpacity*/}
                                    {/*    activeOpacity={0.7}*/}
                                    {/*    onPress={() => {*/}
                                    {/*        this.setState({filterUserId: this.state.loggedUserId}, () => {*/}
                                    {/*            this.onTabChange('SiteLogs')*/}
                                    {/*        })*/}
                                    {/*    }}*/}
                                    {/*    style={[Styles.aitCenter, Styles.padH10,*/}
                                    {/*        logTab === 'SiteLogs' ? Styles.bgDarkRed : Styles.bgWhite*/}
                                    {/*    ]}>*/}
                                    {/*    <Text*/}
                                    {/*        style={[Styles.f18, Styles.p5, Styles.ffMbold, logTab === 'SiteLogs' ? Styles.cWhite : Styles.cBlk]}>Site*/}
                                    {/*        Logs</Text>*/}
                                    {/*</TouchableOpacity>*/}
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            this.setState({filterUserId: this.state.loggedUserId,totalDayDuration: ''}, () => {
                                                this.onTabChange('MyLogs')
                                            })
                                        }}
                                        style={[Styles.aitCenter, Styles.padH10,
                                            logTab === 'MyLogs' ? Styles.bgDarkRed : Styles.bgWhite
                                        ]}>
                                        <Text
                                            style={[Styles.f18, Styles.p5, Styles.ffMbold, logTab === 'MyLogs' ? Styles.cWhite : Styles.cBlk]}>Summary</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            {
                                logTab === 'MyLogs' && leadRoleAccess
                                    // logTab === 'MyLogs'
                                    ?
                                    <View
                                        style={[Styles.bgLPurple, Styles.aslEnd, Styles.padH10, Styles.row, Styles.br5,]}>
                                        <Text
                                            style={[Styles.ffLBlack, Styles.f16, Styles.aslCenter, Styles.cBlk]}>Site</Text>
                                        <Fontisto name={selfCheckboxEnabled ? "toggle-on" : "toggle-off"}
                                                                size={40} color="#000" style={[Styles.padH5]}
                                                                onPress={() => {
                                                                    this.setState({selfCheckboxEnabled: !selfCheckboxEnabled,usersLogList:[],page :1},()=>{this.getLogHistory()})
                                                                }}/>
                                        <Text style={[Styles.ffLBlack, Styles.f16, Styles.aslCenter, Styles.cBlk]}>Self</Text>
                                    </View>
                                    :
                                    null
                            }

                            {
                                this.state.searchActive && logTab === 'MyLogs'
                                    ?
                                    <View>
                                        <View style={[Styles.row, Styles.padH20]}>
                                            <View style={[Styles.row, Styles.aslStart, Styles.flex1]}>
                                                <Text style={[Styles.ffMregular, Styles.colorBlue,Styles.f16]}>From: </Text>
                                                <Text
                                                    style={[Styles.ffMbold, Styles.colorBlue,Styles.f16]}>{Services.convertDateintoGeneralFormat(this.state.filterFromDate)}</Text>
                                            </View>
                                            <View style={[Styles.row, Styles.aslEnd, Styles.flex1]}>
                                                <Text style={[Styles.ffMregular, Styles.colorBlue,Styles.f16]}>To: </Text>
                                                <Text
                                                    style={[Styles.ffMbold, Styles.colorBlue,Styles.f16]}>{Services.convertDateintoGeneralFormat(this.state.filterToDate)}</Text>
                                            </View>
                                        </View>
                                        <View style={[Styles.row, Styles.flexWrap]}>
                                            {myLogCount.map((list,index) => {
                                                return (
                                                    <View
                                                        key={index}
                                                        style={[Styles.padV5, Styles.padH10,]}><Text
                                                        style={[Styles.ffMregular, Styles.colorBlue, Styles.f16]}><Text
                                                        style={[Styles.ffMbold, Styles.colorBlue]}>{list.status}:</Text> {list.value}
                                                    </Text>
                                                    </View>
                                                );
                                            })}
                                        </View>

                                    </View>
                                    : null
                            }


                            {
                                logTab === 'DashBoard'
                                    ?
                                    this.returnDashBoardView()
                                    :
                                    <View style={{marginBottom: this.state.searchActive ? 100 :40}}>
                                        <Row size={12} nowrap
                                             style={[Styles.row, Styles.p10, Styles.alignCenter, Styles.bgOrangeYellow]}>
                                            <Col sm={4}>
                                                <Text
                                                    style={[Styles.ffMbold, Styles.f16, Styles.alignCenter]}>Name</Text>
                                            </Col>
                                            <Col sm={4}>
                                                <Text
                                                    style={[Styles.ffMbold, Styles.f16, Styles.alignCenter]}>Site/Status</Text>
                                            </Col>
                                            <Col sm={1.5}>
                                                <Text style={[Styles.ffMbold, Styles.f16, Styles.aslCenter]}>IN</Text>
                                            </Col>
                                            <Col sm={1.5}>
                                                <Text style={[Styles.ffMbold, Styles.f16, Styles.aslCenter]}>OUT</Text>
                                            </Col>
                                            <Col sm={1}>
                                                {/*<Text style={[Styles.ffMbold, Styles.f16]}>Time</Text>*/}
                                            </Col>
                                        </Row>
                                        <View style={[Styles.row, Styles.aslCenter, {marginBottom: 30}]}>
                                            {
                                                usersLogList.length > 0 ?
                                                    <FlatList
                                                        style={[Styles.mBtm30]}
                                                        data={usersLogList}
                                                        renderItem={({item, index}) => (
                                                            <TouchableOpacity onPress={() => this.setState({
                                                                logAttendanceData: item,
                                                                logAttendanceDataModal: true,
                                                                totalDayDuration: ''
                                                            })}>
                                                                <Row size={12} nowrap
                                                                     style={[Styles.row, Styles.p10, Styles.alignCenter, {
                                                                         backgroundColor: item.in === true || item.out === true ? ((index % 2) === 0 ? '#f5f5f5' : '#fff') : ((index % 2) === 0 ? '#ffcccb' : '#f6e1c8')
                                                                     }
                                                                     ]}>
                                                                    <Col sm={4}>
                                                                        <View>
                                                                            <Text
                                                                                style={[Styles.ffMregular, Styles.f14]}>{item.attrs.userName || '---'}{' (' + Services.getUserRolesShortName(item.role) + ')'}</Text>
                                                                            {
                                                                                item.requestedAttStatus
                                                                                    ?
                                                                                    <Text
                                                                                        style={[Styles.ffMregular, Styles.f14]}>({item.requestedAttStatus || '---'})</Text>
                                                                                    : null
                                                                            }
                                                                        </View>
                                                                    </Col>
                                                                    <Col sm={4}>
                                                                        {
                                                                            item.logStatus === "SCAN_QR_CODE"
                                                                                ?
                                                                                <Text
                                                                                    style={[Styles.ffMregular, Styles.f14, Styles.padH1]}>{item.attrs.siteCode || '---'}</Text>
                                                                                : null
                                                                        }
                                                                        <Text
                                                                            style={[Styles.ffMregular, Styles.f14, Styles.padH1]}>({item.status || '---'})</Text>
                                                                        {
                                                                            logTab === 'MyLogs' || this.state.searchActive
                                                                                ?
                                                                                <Text style={[Styles.ffMregular, Styles.f14, Styles.padH1]}>({Services.convertDateintoGeneralFormat(item.dateStr)})</Text>
                                                                                : null
                                                                        }
                                                                    </Col>

                                                                    <Col sm={1.5}>
                                                                        <View style={[Styles.alignCenter]}>
                                                                            <Text
                                                                                style={[Styles.ffMbold, Styles.f14, Styles.alignCenter, Styles.cBlk]}>{item.inTime ? Services.convertTimeStamptoBlueColorHMforAttendance(item.inTime, Styles.colorGreen) : '--'}</Text>
                                                                        </View>
                                                                    </Col>
                                                                    <Col sm={1.5}>
                                                                        <View style={[Styles.alignCenter]}>
                                                                            <Text
                                                                                style={[Styles.ffMbold, Styles.f14, Styles.alignCenter, Styles.cBlk]}>{item.outTime ? Services.convertTimeStamptoBlueColorHMforAttendance(item.outTime, Styles.cDarkRed) : '--'}</Text>
                                                                        </View>
                                                                    </Col>
                                                                    <Col sm={1}>
                                                                        <FontAwesome name="info-circle" size={20}
                                                                                     color="#000"
                                                                                     onPress={() => this.setState({
                                                                                         logAttendanceData: item,
                                                                                         logAttendanceDataModal: true,
                                                                                         totalDayDuration: ''
                                                                                     })}
                                                                        />
                                                                    </Col>
                                                                </Row>
                                                            </TouchableOpacity>

                                                        )}
                                                        keyExtractor={(item, index) => index.toString()}
                                                        refreshing={isRefreshing}
                                                        onRefresh={this.handleRefresh}
                                                        onEndReached={this.handleLoadMore}
                                                        contentContainerStyle={{paddingBottom: 50}}
                                                        onEndReachedThreshold={1}
                                                        ListFooterComponent={this.renderFooter}
                                                    />
                                                    :
                                                    <Text
                                                        style={[Styles.colorBlue, Styles.f20, Styles.aslCenter, Styles.ffMregular, Styles.pTop20]}>No
                                                        Attendance Logs
                                                        Found....</Text>
                                            }
                                        </View>
                                    </View>
                            }
                        </View>
                }

                {/*Selected Log Attendance Modal */}
                <Modal
                    transparent={true}
                    visible={this.state.logAttendanceDataModal}
                    onRequestClose={() => {
                        this.setState({logAttendanceDataModal: false})
                    }}>
                    <View style={[Styles.aitCenter, Styles.jCenter, {
                        backgroundColor: 'rgba(0, 0, 0 ,0.7)',
                        top: 0,
                        bottom: 0,
                        flex: 1
                    }]}>
                        <TouchableOpacity onPress={() => {
                            this.setState({logAttendanceDataModal: false})
                        }} style={[Styles.modalbgPosition]}>
                        </TouchableOpacity>
                        <View
                            style={[Styles.bw1, Styles.bgWhite, Styles.aslCenter, Styles.p10, Styles.br10, Styles.mBtm20, {
                                width: Dimensions.get('window').width - 40,
                                height: Dimensions.get('window').height / 1.2
                            }]}>
                            {logAttendanceData ?
                                <ScrollView>
                                    {/*{*/}
                                    {/*    logTab === 'MyLogs'*/}
                                    {/*        ? null*/}
                                    {/*        :*/}
                                    {/*        <TouchableOpacity style={[Styles.aslEnd, Styles.mLt10]}*/}
                                    {/*                          onPress={() => {*/}
                                    {/*                              this.setState({*/}
                                    {/*                                  filterUserId: logAttendanceData.userId,*/}
                                    {/*                                  logAttendanceDataModal: false*/}
                                    {/*                              }, () => {*/}
                                    {/*                                  this.onTabChange('MyLogs')*/}
                                    {/*                              })*/}
                                    {/*                          }}>*/}
                                    {/*            <Text*/}
                                    {/*                style={[Styles.colorGreen, Styles.ffMbold, Styles.f16, {borderBottomWidth: 1}]}>(Fetch*/}
                                    {/*                ALL Logs)</Text>*/}
                                    {/*        </TouchableOpacity>*/}
                                    {/*}*/}
                                    <View style={[Styles.aslCenter]}>
                                        <Text style={[Styles.f18, Styles.ffMbold, Styles.aslCenter, Styles.marV10, Styles.colorBlue,{borderBottomWidth: 1}]}>LOG Summary</Text>
                                    </View>

                                    <View style={[Styles.p5,Styles.aslCenter]}><Text
                                        style={[Styles.ffMbold, Styles.cDarkRed,Styles.f18]}>{logAttendanceData.status || '--'}
                                    </Text></View>

                                    {
                                        logAttendanceData.requestedAttStatus
                                            ?
                                            <View style={[Styles.p5]}><Text
                                                style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                style={[Styles.ffMbold, Styles.colorBlue]}>Approval
                                                Status:</Text> {Services.returnLogAttendanceStatusText(logAttendanceData.requestedAttStatus)}
                                            </Text></View>
                                            :
                                            null
                                    }
                                    {
                                        logAttendanceData.requestApprovalFrom
                                            ?
                                            <View style={[Styles.p5]}><Text
                                                style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                style={[Styles.ffMbold, Styles.colorBlue]}>Action By:</Text> {logAttendanceData.requestApprovalFrom || '--'}
                                            </Text></View>
                                            :
                                            null
                                    }
                                    {
                                        logAttendanceData.approvedAt
                                            ?
                                            <View style={[Styles.p5]}><Text
                                                style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                style={[Styles.ffMbold, Styles.colorBlue]}>Action Time:</Text> {Services.convertDateintoGeneralFormatWithTime(logAttendanceData.approvedAt) || '--'}
                                            </Text></View>
                                            :
                                            null
                                    }
                                    <View style={[Styles.p5]}><Text
                                        style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                        style={[Styles.ffMbold, Styles.colorBlue]}>Name:</Text> {logAttendanceData.attrs.userName || '--'}
                                    </Text></View>
                                    <View style={[Styles.p5]}><Text
                                        style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                        style={[Styles.ffMbold, Styles.colorBlue]}>Date:</Text> {Services.convertDateintoGeneralFormat(logAttendanceData.dateStr) || '--'}
                                    </Text></View>

                                    <View style={[Styles.p5]}><Text
                                        style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                        style={[Styles.ffMbold, Styles.colorBlue]}>Mobile:</Text> {logAttendanceData.attrs.phoneNumber || '--'}
                                    </Text></View>
                                    {
                                        logAttendanceData.logStatus === "SCAN_QR_CODE" || logAttendanceData.logStatus === "WORKING_REMOTELY"
                                            ?
                                            <View>
                                                <View style={[Styles.p5,Styles.row]}>
                                                    <Text style={[Styles.ffMbold, Styles.colorBlue,Styles.pTop3]}>IN:</Text>
                                                    <Text style={[Styles.ffMbold,Styles.f18,Styles.txtAlignCen]}> {logAttendanceData.inTime ? Services.convertTimeStamptoBlueColorHMforAttendance(logAttendanceData.inTime,Styles.colorGreen) : '--'}</Text>
                                                </View>
                                                <View style={[Styles.p5,Styles.row]}>
                                                    <Text style={[Styles.ffMbold, Styles.colorBlue,Styles.pTop3]}>OUT:</Text>
                                                    <Text style={[Styles.ffMbold,Styles.f18,Styles.txtAlignCen]}> {logAttendanceData.outTime ? Services.convertTimeStamptoBlueColorHMforAttendance(logAttendanceData.outTime,Styles.cDarkRed) : '--'}</Text>
                                                </View>
                                            </View>
                                            :
                                            null
                                    }
                                    {
                                        logAttendanceData.logStatus === "SCAN_QR_CODE"
                                            ?
                                            <View>
                                                <View style={[Styles.p5]}><Text
                                                    style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                    style={[Styles.ffMbold, Styles.colorBlue]}>Site
                                                    Name:</Text> {logAttendanceData.attrs.siteName || '--'}</Text></View>
                                                <View style={[Styles.p5]}><Text
                                                    style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                    style={[Styles.ffMbold, Styles.colorBlue]}>Site
                                                    Code:</Text> {logAttendanceData.attrs.siteCode || '--'}</Text></View>
                                            </View>
                                            :
                                            null
                                    }
                                    <View style={[Styles.p5]}><Text style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                        style={[Styles.ffMbold, Styles.colorBlue]}>Role:</Text> {logAttendanceData.role ? Services.getUserRoles(logAttendanceData.role):'--' || '--'} ({logAttendanceData.attrs.wz_id || '--'})</Text></View>

                                    {
                                        logAttendanceData.logStatus === "SCAN_QR_CODE"
                                            ?
                                            <View style={[Styles.p5, Styles.row]}>
                                                <Text style={[Styles.ffMbold, Styles.colorBlue, Styles.pTop3]}>Duration
                                                    at Site:</Text>
                                                <Text
                                                    style={[Styles.ffMbold, Styles.f18, Styles.txtAlignCen, {color: '#8b3363'}]}> {logAttendanceData.attrs.duration || '--'}</Text>
                                            </View>
                                            :
                                            null
                                    }

                                    {
                                        logAttendanceData.longitude
                                            ?
                                            <View style={[Styles.p5]}><Text
                                                style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                style={[Styles.ffMbold, Styles.colorBlue]}>Longitude:</Text> {logAttendanceData.longitude || '--'}
                                            </Text></View>
                                            :
                                            null
                                    }
                                    {
                                        logAttendanceData.latitude
                                            ?
                                            <View style={[Styles.p5]}><Text
                                                style={[Styles.ffMregular, Styles.colorBlue]}><Text
                                                style={[Styles.ffMbold, Styles.colorBlue]}>Latitude:</Text> {logAttendanceData.latitude || '--'}
                                            </Text></View>
                                            :
                                            null
                                    }


                                    {
                                        logAttendanceData.logStatus === "SCAN_QR_CODE" || logAttendanceData.logStatus === "WORKING_REMOTELY"
                                            ?
                                            <TouchableOpacity
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    this.fetchTotalDayDuration(logAttendanceData)
                                                }}
                                                style={[Styles.p5, Styles.row]}>
                                                <Text style={[Styles.ffMbold, Styles.colorBlue, Styles.pTop3]}>Total Duration:</Text>
                                                <Text
                                                    style={[Styles.ffMbold, Styles.f18, Styles.txtAlignCen, {color: '#8b3363'}]}> {this.state.totalDayDuration || '--'}</Text>
                                                <View style={[Styles.bgLPink,Styles.row,Styles.marH5,Styles.aslCenter]}>
                                                    <Text>Fetch</Text>
                                                    <FontAwesome name="refresh" size={20} color="black" style={[Styles.padH10]} />
                                                </View>
                                            </TouchableOpacity>
                                            :
                                            null
                                    }

                                    {/*<View style={[Styles.p5,Styles.row]}>*/}
                                    {/*    <Text style={[Styles.ffMbold, Styles.colorBlue,Styles.pTop3]}>Current Duration:</Text>*/}
                                    {/*    <Text style={[Styles.ffMbold,Styles.f18,Styles.txtAlignCen,{color : '#8b3363'}]}> {Services.returnTimestampDiffernces(logAttendanceData.inTime,logAttendanceData.outTime)}</Text>*/}
                                    {/*</View>*/}

                                </ScrollView> : null
                            }
                        </View>

                    </View>

                </Modal>


                {/*USER Status Selection POP-UP*/}
                <Modal transparent={true}
                       visible={this.state.userLogStatusModal}
                       animated={true}
                       animationType='slide'
                       onRequestClose={() => {
                           // this.setState({userLogStatusModal: false})
                       }}>
                    <View style={[Styles.modalfrontPosition]}>
                        <View
                            style={[[Styles.bw1, Styles.aslCenter, Styles.p15, Styles.br40, Styles.bgWhite, {
                                width: Dimensions.get('window').width - 80,
                            }]]}>
                            <View style={[Styles.bgWhite, {height: Dimensions.get('window').height / 2.1,}]}>
                                <View style={Styles.aslCenter}>
                                    <Text
                                        style={[Styles.ffMbold, Styles.colorBlue, Styles.f20, Styles.m10, Styles.mBtm20]}>Select
                                        Attendance Status</Text>
                                </View>
                                <ScrollView>
                                    <List.Section>
                                        {
                                            this.state.attendenceTypes.map((item,index) => {
                                                return (
                                                    <List.Item
                                                        onPress={() => {
                                                            // this.setState({selectedLogType:item.key,selectedLogValue:item.name, userLogStatusModal:false})

                                                            if (item.key === "ON_LEAVE" || item.key === "PRIVILEGE_LEAVE" || item.key === "EXIGENCY_LEAVE" || item.key === "COMPENSATION_LEAVE"){
                                                                Alert.alert('Are you sure you want to select ' + item.name + ' ?', alert,
                                                                    [{
                                                                        text: 'Yes', onPress: () => {
                                                                            this.setState({selectedLogType:item.key,selectedLogValue:item.name,userLogStatusModal: false},()=>{
                                                                                this.updateUserLogStatus(item.key,'')
                                                                            })
                                                                        }
                                                                    },{text: 'No'}
                                                                    ]
                                                                )
                                                            }else if (item.key === "SCAN_QR_CODE") {
                                                                this.setState({selectedLogType:item.key,selectedLogValue:item.name,userLogStatusModal: false},()=>{
                                                                    this.props.navigation.navigate('ScanQRcode', {UserFlow: 'UserAttendanceLog'});
                                                                })
                                                            } else {
                                                                this.setState({selectedLogType:item.key,selectedLogValue:item.name, userLogStatusModal:false})
                                                            }
                                                        }}
                                                        // style={{marign: 0, padding: 0,}}
                                                        key={index}
                                                        title={item.name }
                                                        titleStyle={[Styles.ffMregular, Styles.colorBlue, Styles.f16, Styles.aslCenter, Styles.bw1,
                                                            Platform.OS === 'ios' ? Styles.br0 : Styles.br100,
                                                            {
                                                                width: 210,
                                                                textAlign: 'center',
                                                                paddingHorizontal: 5,
                                                                paddingVertical: 10,
                                                                backgroundColor: '#fff',
                                                                color:  '#233167',
                                                            }]}
                                                    />
                                                );
                                            })
                                        }

                                    </List.Section>
                                </ScrollView>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => {
                            this.setState({userLogStatusModal: false},()=>{
                                // this.props.navigation.goBack()
                            })
                        }} style={{marginTop: 20}}>
                            {LoadSVG.cancelIcon}
                        </TouchableOpacity>
                    </View>
                </Modal>

                {/*filters*/}
                <Modal transparent={true}
                       visible={this.state.filtersModal}
                       animated={true}
                       animationType='fade'
                       onRequestClose={() => {
                           this.setState({filtersModal: false})
                       }}>
                    <View style={[Styles.modalfrontPosition]}>
                        {this.state.spinnerBool === false ? null : <CSpinner/>}
                        <View
                            style={[[Styles.bw1, Styles.aslCenter, Styles.br5, Styles.bgDWhite, {
                                width: Dimensions.get('window').width - 20,
                            }]]}>
                            <View style={[Styles.bgDWhite, {height: Dimensions.get('window').height / 1.3}]}>
                                <Text
                                    style={[Styles.ffMbold, Styles.aslCenter, Styles.colorBlue, Styles.f20, Styles.marV10]}>Filter Options</Text>
                                <ScrollView persistentScrollbar={true}>
                                    <View style={[Styles.p10]}>

                                        {/*FROM DATE*/}
                                        <Card style={[Styles.OrdersScreenCardshadow,Styles.m10]}
                                              onPress={() => this.setState({filterDate:'filterFromDate',showDateTimepicker:true})}>
                                            <Card.Title
                                                style={[Styles.bgWhite]}
                                                title={Services.convertDateintoGeneralFormat(this.state.filterFromDate)}
                                                titleStyle={[Styles.f18, Styles.ffMbold]}
                                                subtitle={'From Date'}
                                                rightStyle={[Styles.marH10]}
                                                right={() => <FontAwesome  name="calendar" size={30} color="#000"
                                                />}
                                            />
                                        </Card>
                                        {
                                            this.state.showDateTimepicker && this.state.filterDate === 'filterFromDate'
                                                ?
                                                <RNDateTimePicker
                                                    style={[Styles.bgLBlueMix]}
                                                    mode={'date'}
                                                    value={new Date(this.state.filterFromDate)}
                                                    maximumDate= {new Date()}
                                                    onChange={(event, date) => { this.validateDateSelection(date) }}
                                                />
                                                :
                                                null
                                        }
                                        {/*TO DATE*/}
                                        <Card style={[Styles.OrdersScreenCardshadow,Styles.m10]}
                                              onPress={() => this.setState({filterDate:'filterToDate',showDateTimepicker:true})}>
                                            <Card.Title
                                                style={[Styles.bgWhite]}
                                                // title={new Date().toDateString()}
                                                title={Services.convertDateintoGeneralFormat(this.state.filterToDate)}
                                                titleStyle={[Styles.f18, Styles.ffMbold]}
                                                subtitle={'To Date'}
                                                rightStyle={[Styles.marH10]}
                                                right={() => <FontAwesome  name="calendar" size={30} color="#000"
                                                />}
                                            />
                                        </Card>
                                        {
                                            this.state.showDateTimepicker && this.state.filterDate === 'filterToDate'
                                                ?
                                                <RNDateTimePicker
                                                    style={[Styles.bgLBlueMix]}
                                                    mode={'date'}
                                                    value={new Date(this.state.filterFromDate)}
                                                    minimumDate={new Date(this.state.filterFromDate)}
                                                    maximumDate= {new Date()}
                                                    onChange={(event, date) => { this.validateDateSelection(date) }}
                                                />
                                                :
                                                null
                                        }

                                        {/*SITES DROPDOWN*/}
                                        <Text style={[Styles.ffMregular, Styles.aslStart, Styles.colorBlue, Styles.f16, Styles.marV10,Styles.marH10]}>Select Site</Text>
                                        <Card style={[Styles.OrdersScreenCardshadow, Styles.marH10,Styles.mBtm10]}>
                                            <Picker
                                                mode={'dropdown'}
                                                // ref={pickerRef}
                                                itemStyle={[Styles.f18, Styles.colorBlue,Styles.fWbold]}
                                                selectedValue={this.state.filterSiteId}
                                                onValueChange={(itemValue, itemIndex) => this.setState({filterSiteId: itemValue})}
                                            >
                                                {this.state.sitesList.map((item, index) => {
                                                    return (< Picker.Item
                                                        label={item.id ? item.attrs.siteLable : item.siteLable}
                                                        value={item.id}
                                                        key={index}/>);
                                                })}
                                            </Picker>
                                        </Card>

                                        {/*ROLES LIST*/}
                                        <Text style={[Styles.ffMregular, Styles.aslStart, Styles.colorBlue, Styles.f16, Styles.marV10,Styles.marH10]}>Select Role</Text>
                                        <Card style={[Styles.OrdersScreenCardshadow,Styles.marH10,Styles.mBtm10]}>
                                            <Picker
                                                itemStyle={[Styles.f18, Styles.colorBlue,Styles.fWbold]}
                                                selectedValue={this.state.filterRoleId}
                                                mode={'dropdown'}
                                                onValueChange={(itemValue, itemIndex) => this.setState({filterRoleId: itemValue})}
                                            >
                                                {this.state.rolesList.map((item, index) => {
                                                    return (< Picker.Item
                                                        label={Services.returnRoleName(item.key)}
                                                        value={item.value}
                                                        key={index}/>);
                                                })}
                                            </Picker>
                                        </Card>

                                        {/*LOG TYPES LIST*/}
                                        <Text style={[Styles.ffMregular, Styles.aslStart, Styles.colorBlue, Styles.f16, Styles.marV10,Styles.marH10]}>Select Log Type</Text>
                                        <Card style={[Styles.OrdersScreenCardshadow,Styles.marH10,Styles.mBtm10]}>
                                            <Picker
                                                itemStyle={[Styles.f18, Styles.colorBlue,Styles.fWbold]}
                                                selectedValue={this.state.filterLogStatus}
                                                mode='dropdown'
                                                onValueChange={(itemValue, itemIndex) => this.setState({filterLogStatus: itemValue})}
                                            >
                                                {this.state.logTypeList.map((item, index) => {
                                                    return (< Picker.Item
                                                        label={item.name}
                                                        value={item.key}
                                                        key={index}/>);
                                                })}
                                            </Picker>
                                        </Card>
                                    </View>
                                </ScrollView>
                                <Card.Actions
                                    style={[Styles.row, Styles.jSpaceArd, Styles.marV10]}>
                                    <TouchableOpacity
                                        onPress={() =>{
                                            this.onTabChange(logTab)
                                        }}
                                        style={[Styles.bgDBlue]}
                                    activeOpacity={0.7}>
                                        <Text style={[Styles.cWhite,Styles.f18,Styles.p5]}>Reset Filters</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => {
                                            this.setState({usersLogList: [],page: 1,searchActive:true},()=>{
                                                this.getLogHistory();
                                            })
                                        }}
                                        style={[Styles.bgGrn]}
                                        activeOpacity={0.7}>
                                        <Text style={[Styles.cWhite,Styles.f18,Styles.p5]}> Search </Text>
                                    </TouchableOpacity>
                                </Card.Actions>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => {
                            this.setState({filtersModal: false})
                        }} style={{marginTop: 20}}>
                            {LoadSVG.cancelIcon}
                        </TouchableOpacity>
                    </View>
                </Modal>


            </View>
        );
    }
}

const styles = StyleSheet.create({
    appbar: {
        backgroundColor: "white"
    },
    section: {
        backgroundColor: "white"
    },
    container: {
        flex: 1,
        backgroundColor: "white"
    },
    time: {
        marginTop: 20,
        marginRight: 10
    },
    item: {
        // borderBottomColor: Colors.grey200,
        borderBottomWidth: 1
    }
});
