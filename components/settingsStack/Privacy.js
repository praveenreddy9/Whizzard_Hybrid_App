import * as React from "react";
import { View, StyleSheet,Dimensions } from "react-native";
import { Appbar} from "react-native-paper";
// import { WebView } from 'react-native-webview';
import {CSpinner, Styles} from "../common";

export default class Privacy extends React.Component {

  constructor(props) {
    super(props);
    this.state={
        spinnerBool:false
    }
  }
    renderSpinner() {
        if (this.state.spinnerBool)
            return <CSpinner/>;
        return false;
    }

  render() {
    return (
      <View style={[Styles.flex1]}>
          {this.renderSpinner()}
        <Appbar.Header style={[Styles.bgDarkRed]}>
          <Appbar.BackAction onPress={() => this.props.navigation.goBack()} />
          <Appbar.Content title="Privacy Policy" />
        </Appbar.Header>
          {/*<WebView style={{height:Dimensions.get('window').height,width: Dimensions.get('window').width}}*/}
          {/*         onLoadStart={()=>{this.setState({spinnerBool:true})}}*/}
          {/*         onLoadEnd={()=>{this.setState({spinnerBool:false})}}*/}
          {/*         // source={{ uri: 'https://reactnative.dev/' }}*/}
          {/*         source={{ uri: 'http://whizzard.in/terms' }}*/}
          {/*/>*/}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  appbar: {
    backgroundColor: "white"
  }
});
