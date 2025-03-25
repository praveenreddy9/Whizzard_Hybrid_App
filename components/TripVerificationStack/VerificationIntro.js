import * as React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Platform,
    FlatList,
    Modal,
    Dimensions,
    TextInput,
    Keyboard,
    Alert,
    Image,
    ActivityIndicator, StyleSheet, ImageBackground, Linking
} from "react-native";
import {
    Appbar,
    Card,
    List,
    RadioButton
} from "react-native-paper";
import HomeScreen from '../HomeScreen';
import {CDismissButton, CSpinner, LoadImages, LoadSVG, Styles, CLoader} from "../common";
import Utils from '../common/Utils';
import OfflineNotice from "../common/OfflineNotice";
import Config from "../common/Config";
import Services from "../common/Services";
import MaterialIcons from "react-native-vector-icons/dist/MaterialIcons";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import _ from 'lodash';
import ImageZoom from "react-native-image-pan-zoom";
import Swiper from 'react-native-deck-swiper'
import FastImage from "react-native-fast-image";

const colors = ['#D6D1B4', '#F3F2F2', '#FFEE93', '#ccf6d8', '#ECF3AB', '#F8F1EC', '#F4EDAB'];

// demo purposes only
function* range(start, end) {
    for (let i = start; i <= end; i++) {
        yield i
    }
}

const windowWidth = Dimensions.get('window').width;
const editModalHeight = Dimensions.get('window').height / 1.5;
const subEditHeightBy60 = editModalHeight - 60;
const subEditDetialsWidth = windowWidth / 2;

export default class VerificationIntro extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            reportsList: [],
            page: 1,
            size: 20,
            totalElements: 0,
            refreshing: false,
            spinnerBool: false,

            //latest
            imagePreview: false,
            imagePreviewURL: '',
            imageRotate: '0',
            dateBasedCountModal: false,
            tripDetailsCardModal: false,

            sitesListBasedOnDateModal: false,
            // cards: [...range(1, 5)],
            cards: [],
            siteInfo: [],
            pendingDatesInfo: [],
            swipedAllCards: false,
            swipeDirection: '',
            cardIndex: 0,
            editTripDetailsModal: false,
            clientUserIdDetailsUpdated: false,
            tripSheetIdDetailsUpdated: false,
            kilometerDetailsUpdated: false,
            packageDetailsUpdated: false,
            shortCashDetailsUpdated: false,
            penaltyDetailsUpdated: false,
            clientEmployeeIdDetailsUpdated: false,
            liteUserPaymentDetailsUpdated: false,
            partnerDetailsUpdated: false,
            clientLoginIdDetailsUpdated: false,
            paymentPlanDetailsUpdated: false,
            operationsTypeDetailsUpdated: false,
            vehicleImageDetailsUpdated: false,
            rejectTripModal: false,
            plannedLeave: false,
            unPlannedLeave: false,
            notWorked: false,
            infinite: false,
            currentIndex: 0,
            currentCardCount: 0,
            filterTripType: 'ALL',
            requiredTripFilter: 'UN_VERIFIED', //UN_VERIFIED,VERIFIED,REJECTED
            showUnVerifiedTripData:true,
            nextCardfetched: false,
            penaltyReasons: [
                {reason: 'Late reporting', value: 0,status:false},
                {reason: 'Incorrect client login ID', value: 1,status:false},
                {reason: 'Incorrect kilometer readings', value: 2,status:false},
                {reason: 'Incorrect package count', value: 3,status:false},
                {reason: 'Short Cash', value: 4,status:false},
                {reason: 'Trip verification incomplete', value: 5,status:false},
                {reason: 'Incorrect payment details', value: 6,status:false},
            ],plansList:[],searchedPaymentPlanList:[],paymentPlanSelectionModal:false,
            operationsTypeList:[],operationsTypeSelectionModal:false,
            errorBeneficiaryIFSCcode: null,
            tempVehicleVerificationImageUrl: '',
            tempVehicleVerificationImageFormData: ''

            // tempSearchPhoneNumber:'8096712223'
        }

        // cardIndex ===> Uses to update the data (will increase and decrease the index),the Index is position from cards list,
        //currentIndex ===>will Increase the index if card is verified/rejected
        //swipedIndex ===>Index of selected card (uses the index at renderCard)
    }

    componentDidMount() {
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            // Services.checkMockLocationPermission((response) => {
            //     if (response){
            //         this.props.navigation.navigate('Login')
            //     }
            // })
            AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
                let tempRole = JSON.parse(userRole)
                self.setState({userRole: tempRole}, () => {
                    self.getAllDatesTripCount()
                })
            })
        })
    }

    renderSpinner() {
        if (this.state.spinnerBool)
            return <CLoader/>
        return false;
    }

    errorHandling(error) {
        console.log("trip intro error", error, error.response);
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

    //API to get date trip count
    getAllDatesTripCount() {
        const self = this;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_TRIPS_COUNTS_DATE_MOBILE;
        const body = {
            tripType: self.state.filterTripType,
            requiredTrips:self.state.requiredTripFilter
        }
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequestForShiftFlow(apiURL, "POST", body, (response) => {
                if (response.status === 200) {
                    let responseList = response.data
                    self.setState({
                        spinnerBool: false,
                        pendingDatesInfo: responseList,
                        swipedAllCards: false,
                        showUnVerifiedTripData:self.state.requiredTripFilter === 'UN_VERIFIED'
                    });
                }
            }, (error) => {
                self.errorHandling(error)
            })
        });
    }

    render() {
        return (
            <View style={[Styles.flex1, Styles.bgWhite]}>
                {this.renderSpinner()}
                <OfflineNotice/>
                <Appbar.Header style={[Styles.bgDarkRed, Styles.jSpaceBet]}>
                    <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                    <Text
                        style={[Styles.ffRMedium, Styles.cLightWhite, Styles.aslCenter, Styles.f18]}>Trip
                        Verification</Text>
                    <View style={[Styles.padH15]}/>
                </Appbar.Header>
                <View style={[Styles.flex1, Styles.bgWhite]}>
                    <Text style={[Styles.f14,Styles.ffRBlack, Styles.fWbold,Styles.colorLblue,Styles.marH20,Styles.pTop10,Styles.pBtm5]}>Trip type</Text>
                    <View style={[Styles.row, Styles.jSpaceBet,Styles.marH20]}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={()=>{this.setState({requiredTripFilter:'UN_VERIFIED'},()=>{this.getAllDatesTripCount()})}}
                            style={[Styles.alignCenter, Styles.padV3,this.state.requiredTripFilter === 'UN_VERIFIED' ? Styles.bgDarkRed : Styles.dgLWhite, Styles.br8,
                                Styles.OrdersScreenCardshadow, {width: windowWidth /3.6}]}>
                            <Text
                                style={[Styles.f14, Styles.padV5, Styles.ffRMedium, Styles.fWbold,this.state.requiredTripFilter === 'UN_VERIFIED' ? Styles.colorLWhite : Styles.cGrey33]}>Un Verified</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={()=>{this.setState({requiredTripFilter:'VERIFIED'},()=>{this.getAllDatesTripCount()})}}
                            style={[Styles.alignCenter, Styles.padV3,this.state.requiredTripFilter === 'VERIFIED' ? Styles.bgDarkRed : Styles.dgLWhite, Styles.br8,
                                Styles.OrdersScreenCardshadow, {width: windowWidth /3.6}]}>
                            <Text
                                style={[Styles.f14, Styles.padV5, Styles.ffRMedium, Styles.fWbold,this.state.requiredTripFilter === 'VERIFIED' ? Styles.colorLWhite : Styles.cGrey33]}>Verified</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={()=>{this.setState({requiredTripFilter:'REJECTED'},()=>{this.getAllDatesTripCount()})}}
                            style={[Styles.alignCenter, Styles.padV3,this.state.requiredTripFilter === 'REJECTED' ? Styles.bgDarkRed : Styles.dgLWhite, Styles.br8,
                                Styles.OrdersScreenCardshadow, {width: windowWidth /3.6}]}>
                            <Text
                                style={[Styles.f14, Styles.padV5, Styles.ffRMedium, Styles.fWbold,this.state.requiredTripFilter === 'REJECTED' ? Styles.colorLWhite : Styles.cGrey33]}>Rejected</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[Styles.f14,Styles.ffRRegular, Styles.fWbold,Styles.colorLblue,Styles.marH20,Styles.padV10]}>User type</Text>
                    <View style={[Styles.pBtm10,Styles.marH20]}>
                        {/*<RadioButton.Group*/}
                        {/*    onValueChange={filterTripType => this.setState({filterTripType}, () => {*/}
                        {/*        this.getAllDatesTripCount()*/}
                        {/*    })}*/}
                        {/*    value={this.state.filterTripType}>*/}
                            <View>

                                <View style={[Styles.row]}>
                                    <View style={[Styles.row, Styles.aslStart,Styles.flex1]}>
                                        <RadioButton.Android value={'ALL'} color={'red'} uncheckedColor={'#C91A1F'}
                                                     status={this.state.filterTripType === 'ALL'?'checked' : 'unchecked'}
                                                     onPress={()=>{this.setState({filterTripType:'ALL'},()=>{this.getAllDatesTripCount()})}}/>
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={()=>{this.setState({filterTripType:'ALL'},()=>{this.getAllDatesTripCount()})}}
                                            style={[Styles.aslCenter]}>
                                            <Text style={[Styles.ffRMedium, Styles.cGrey33,Styles.f16]}>{' '}All</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={[Styles.row, Styles.aslStart,Styles.flex1]}>
                                        <RadioButton.Android value={'LITE_USER'} color={'red'} uncheckedColor={'#C91A1F'}
                                                     status={this.state.filterTripType === 'LITE_USER'?'checked' : 'unchecked'}
                                                     onPress={()=>{this.setState({filterTripType:'LITE_USER'},()=>{this.getAllDatesTripCount()})}}/>
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={()=>{this.setState({filterTripType:'LITE_USER'},()=>{this.getAllDatesTripCount()})}}
                                            style={[Styles.aslCenter]}>
                                            <Text style={[Styles.ffRMedium, Styles.cGrey33,Styles.f16]}>{' '}Lite User</Text>
                                        </TouchableOpacity>
                                    </View>

                                </View>
                                <View style={[Styles.row]}>
                                    <View style={[Styles.row, Styles.aslStart,Styles.flex1]}>
                                        <RadioButton.Android value={'AUTO_CREATED_SHIFT'} color={'red'} uncheckedColor={'#C91A1F'}
                                                     status={this.state.filterTripType === 'AUTO_CREATED_SHIFT'?'checked' : 'unchecked'}
                                                     onPress={()=>{this.setState({filterTripType:'AUTO_CREATED_SHIFT'},()=>{this.getAllDatesTripCount()})}}/>
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={()=>{this.setState({filterTripType:'AUTO_CREATED_SHIFT'},()=>{this.getAllDatesTripCount()})}}
                                            style={[Styles.aslCenter]}>
                                            <Text style={[Styles.ffRMedium, Styles.cGrey33,Styles.f16]}>{' '}Regular auto</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={[Styles.row, Styles.aslStart,Styles.flex1]}>
                                        <RadioButton.Android value={'ADHOC_SHIFT'} color={'red'} uncheckedColor={'#C91A1F'}
                                                     status={this.state.filterTripType === 'ADHOC_SHIFT'?'checked' : 'unchecked'}
                                                     onPress={()=>{this.setState({filterTripType:'ADHOC_SHIFT'},()=>{this.getAllDatesTripCount()})}}/>
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={()=>{this.setState({filterTripType:'ADHOC_SHIFT'},()=>{this.getAllDatesTripCount()})}}
                                            style={[Styles.aslCenter]}>
                                            <Text style={[Styles.ffRMedium, Styles.cGrey33,Styles.f16]}>{' '}Regular Manual</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        {/*</RadioButton.Group>*/}
                    </View>
                    {
                        this.state.pendingDatesInfo.length === 0
                            ?
                            <View style={[Styles.flex1, Styles.aitCenter, Styles.jCenter]}>
                                <Text style={[Styles.ffRBold, Styles.f18, Styles.alignCenter]}>No Shifts
                                    Found..</Text>
                            </View>
                            :
                            <FlatList
                                data={this.state.pendingDatesInfo}
                                renderItem={({item, index}) => {
                                    return (
                                        <TouchableOpacity
                                            onPress={() => {
                                                this.setState({filterDate: item.tripDateStr}, () => {
                                                    const sitesDataBasedOnDate = {
                                                        filterSiteId: this.state.filterSiteId,
                                                        filterDate: this.state.filterDate,
                                                        filterTripType: this.state.filterTripType,
                                                        requiredTripFilter: this.state.requiredTripFilter,
                                                        showUnVerifiedTripData:this.state.requiredTripFilter === 'UN_VERIFIED'
                                                    }
                                                    this.props.navigation.navigate('VerificationFetchSitesDateBased',{sitesDataBasedOnDate})
                                                })
                                            }}
                                            activeOpacity={0.7}
                                            style={[Styles.marH20, Styles.marV7, Styles.row, Styles.aslCenter, Styles.jSpaceBet, Styles.br5, Styles.padH15, Styles.padV15,
                                                Styles.bgLBlueWhite, Styles.TripReportsCardMainshadow, {
                                                    width: Dimensions.get('window').width - 36
                                                }]}>

                                            <View style={[Styles.aslCenter, Styles.row]}>
                                                <MaterialIcons style={[Styles.aslCenter, Styles.pRight15]}
                                                               name="error" size={26} color="#EB5757"/>
                                                <Text
                                                    style={[Styles.f18, Styles.ffRMedium, Styles.cGrey33, Styles.aslCenter]}>{Services.returnDateMonthYearFormatinShort(item.tripDateStr)}</Text>
                                            </View>
                                            <View style={[Styles.alignCenter, Styles.row]}>
                                                <Text
                                                    style={[Styles.f22, Styles.ffRMedium, Styles.cOrange, Styles.aslStart]}>{item.unverifiedCount ? item.unverifiedCount : 0}</Text>
                                                <MaterialIcons
                                                    style={[Styles.aslCenter, Styles.mLt15, Styles.br8, {backgroundColor: '#F2F2F2'}, Styles.p3]}
                                                    name="chevron-right" size={24} color="#4F4F4F"/>
                                            </View>
                                        </TouchableOpacity>
                                    )
                                }}
                                extraData={this.state}
                                keyExtractor={(item, index) => index.toString()}/>
                    }

                </View>

            </View>
        );
    }
};
