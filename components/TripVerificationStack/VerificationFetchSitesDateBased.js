// VerificationFetchSitesDateBased
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
    DefaultTheme,
    List,
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

export default class VerificationFetchSitesDateBased extends React.Component {

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
            tempVehicleVerificationImageFormData: '',

            // tempSearchPhoneNumber:'8096712223'

            sitesDataBasedOnDate:{}
        }
    }

    componentDidMount() {
        const self = this;
        this._subscribe = this.props.navigation.addListener('didFocus', () => {
            let sitesDataBasedOnDate = this.props.navigation.state.params.sitesDataBasedOnDate
            AsyncStorage.getItem('Whizzard:userRole').then((userRole) => {
                let tempRole = JSON.parse(userRole)
                self.setState({userRole: tempRole,sitesDataBasedOnDate}, () => {
                    self.getMappedSiteCountBasedOnDate()
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
        console.log("trip sites error", error, error.response);
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

    //API mapped sites trip count based on date
    getMappedSiteCountBasedOnDate() {
        const self = this;
        const {sitesDataBasedOnDate} = self.state;
        const apiURL = Config.routes.BASE_URL + Config.routes.GET_TRIPS_COUNTS_SITE_AND_DATE_BASED_MOBILE;
        const body = {
            reportDateStr:sitesDataBasedOnDate.filterDate,
            tripType:sitesDataBasedOnDate.filterTripType,
            requiredTrips:sitesDataBasedOnDate.requiredTripFilter
        }
        this.setState({spinnerBool: true}, () => {
            Services.AuthHTTPRequestForShiftFlow(apiURL, "POST", body, (response) => {
                if (response.status === 200) {
                    let responseList = response.data
                    self.setState({
                        spinnerBool: false,
                        siteInfo: responseList.reports,
                        totalReports: responseList.totalReports,
                        sitesListBasedOnDateModal: true
                    });
                }
            }, (error) => {
                self.errorHandling(error)
            })
        });
    }


    render() {
        const {sitesDataBasedOnDate} =this.state;
        return (
            <View style={[Styles.flex1, Styles.bgWhite]}>
                {this.renderSpinner()}
                <OfflineNotice/>
                <View style={[Styles.flex1, Styles.bgWhite]}>
                    <Appbar.Header style={[Styles.bgDarkRed, Styles.jSpaceBet]}>
                        <Appbar.BackAction onPress={() => this.props.navigation.goBack()}/>
                        <Text
                            style={[Styles.ffRMedium, Styles.cLightWhite, Styles.aslCenter, Styles.f18]}>{_.startCase(_.lowerCase(sitesDataBasedOnDate.filterTripType === 'AUTO_CREATED_SHIFT' ? 'Auto Created' : this.state.filterTripType === 'ADHOC_SHIFT' ? 'Adhoc' :this.state.filterTripType))} Trips
                            ({Services.returnDateMonthYearFormatinMonthShort(sitesDataBasedOnDate.filterDate)})</Text>
                        <View style={[Styles.padH15]}/>
                    </Appbar.Header>
                    <View style={[Styles.flex1]}>
                        {
                            this.state.siteInfo
                                ?
                                <ScrollView style={[Styles.marV15]}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            this.setState({filterSiteId: '', filterSiteCode: 'ALL',sitesListBasedOnDateModal:false}, () => {
                                                // this.getUnverifiedTripList()
                                                const swippingCardsFilters = {
                                                    filterSiteId: '',
                                                    filterDate: sitesDataBasedOnDate.filterDate,
                                                    filterTripType: sitesDataBasedOnDate.filterTripType,
                                                    requiredTripFilter: sitesDataBasedOnDate.requiredTripFilter,
                                                    showUnVerifiedTripData: sitesDataBasedOnDate.requiredTripFilter === 'UN_VERIFIED'
                                                }
                                                this.props.navigation.navigate('VerificationSwippingCards',{swippingCardsFilters})
                                            })
                                        }}
                                        activeOpacity={0.7}
                                        style={[Styles.marH20, Styles.marV7, Styles.row, Styles.aslCenter, Styles.jSpaceBet, Styles.br5, Styles.padH20, Styles.padV15,
                                            Styles.bgLBlueWhite, Styles.TripReportsCardMainshadow, {
                                                width: Dimensions.get('window').width - 36
                                            }]}>

                                        <View style={[Styles.aslCenter]}>
                                            <Text
                                                style={[Styles.f18, Styles.ffRMedium, Styles.cGrey33, Styles.aslCenter]}>All</Text>
                                        </View>
                                        <View style={[Styles.alignCenter, Styles.row]}>
                                            <Text
                                                style={[Styles.f22, Styles.ffRMedium, Styles.cOrange, Styles.aslStart]}>{this.state.totalReports ? this.state.totalReports : 0}</Text>
                                            <MaterialIcons
                                                style={[Styles.aslCenter, Styles.mLt15, Styles.br8, {backgroundColor: '#F2F2F2'}, Styles.p3]}
                                                name="chevron-right" size={24} color="#4F4F4F"/>
                                        </View>
                                    </TouchableOpacity>
                                    <View style={{
                                        borderBottomWidth: 1,
                                        marginHorizontal: 16,
                                        marginVertical: 5,
                                        borderBottomColor: '#E1E1E1'
                                    }}/>
                                    {
                                        this.state.siteInfo.map((item, index) => {
                                            return (
                                                <View key={index}>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            this.setState({
                                                                filterSiteId: item.siteId,
                                                                filterSiteCode: item.siteCode,
                                                                sitesListBasedOnDateModal:false
                                                            }, () => {
                                                                const swippingCardsFilters = {
                                                                    filterSiteId: item.filterSiteId,
                                                                    filterDate: sitesDataBasedOnDate.filterDate,
                                                                    filterTripType: sitesDataBasedOnDate.filterTripType,
                                                                    requiredTripFilter: sitesDataBasedOnDate.requiredTripFilter,
                                                                    showUnVerifiedTripData: sitesDataBasedOnDate.requiredTripFilter === 'UN_VERIFIED'
                                                                }
                                                                this.props.navigation.navigate('VerificationSwippingCards',{swippingCardsFilters})
                                                            })
                                                        }}
                                                        activeOpacity={0.7}
                                                        style={[Styles.marH20, Styles.marV7, Styles.row, Styles.aslCenter, Styles.jSpaceBet, Styles.br5, Styles.padH20, Styles.padV15,
                                                            Styles.bgLBlueWhite, Styles.TripReportsCardMainshadow, {
                                                                width: Dimensions.get('window').width - 36
                                                            }]}>

                                                        <View style={[Styles.aslCenter]}>
                                                            <Text
                                                                style={[Styles.f18, Styles.ffRMedium, Styles.cGrey33, Styles.aslCenter]}>{item.siteCode}</Text>
                                                        </View>
                                                        <View style={[Styles.alignCenter, Styles.row]}>
                                                            <Text
                                                                style={[Styles.f22, Styles.ffRMedium, Styles.cOrange, Styles.aslStart]}>{item.unverifiedCount ? item.unverifiedCount : 0}</Text>
                                                            <MaterialIcons
                                                                style={[Styles.aslCenter, Styles.mLt15, Styles.br8, {backgroundColor: '#F2F2F2'}, Styles.p3]}
                                                                name="chevron-right" size={24} color="#4F4F4F"/>
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                            )
                                        })
                                    }
                                </ScrollView>
                                :
                                <View style={[Styles.flex1, Styles.aitCenter, Styles.jCenter]}>
                                    <Text style={[Styles.ffRBold, Styles.f20, Styles.alignCenter]}>No Shifts
                                        Found..</Text>
                                </View>
                        }
                    </View>
                </View>

            </View>
        );
    }
};
