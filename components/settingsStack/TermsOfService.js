import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Appbar, DefaultTheme, Provider as PaperProvider } from "react-native-paper";
import {Styles} from '../common';

export default class TermsOfService extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View>
        <Appbar.Header  style={styles.appbar}>
          <Appbar.BackAction onPress={() => this.props.navigation.goBack()} />
          <Appbar.Content title="Terms of Service" />
        </Appbar.Header>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  appbar: {
    backgroundColor: "white"
  }
});
