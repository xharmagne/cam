import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Vibration,
  Blob
} from "react-native";
import { Camera, Permissions, FileSystem } from "expo";

export default class App extends React.Component {
  state = {
    hasCameraPermission: null,
    type: Camera.Constants.Type.back,
    photoId: 1,
    emotion: "???"
  };

  async componentWillMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === "granted" });
  }

  componentDidMount() {
    FileSystem.makeDirectoryAsync(
      FileSystem.documentDirectory + "photos"
    ).catch(e => {
      console.log(e, "Directory exists");
    });
  }

  takePicture = async function() {
    if (this.camera) {
      this.camera.takePictureAsync({ quality: 0.2 }).then(data => {
        fetch(data.uri)
          .then(res => {
            return res.blob();
          })
          .then(blob => {
            console.log("blob", blob);

            fetch(
              `https://australiaeast.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceAttributes=emotion`,
              {
                method: "POST",
                body: blob,
                headers: new Headers({
                  "Content-Type": "application/octet-stream",
                  "Ocp-Apim-Subscription-Key": "??????"
                })
              }
            )
              .then(resp => {
                console.log("resp");
                return resp.json();
              })
              .then(data => {
                console.log("d", data);

                var maxEmotion = "";
                var maxEmotionVal = 0;
                Object.keys(data[0].faceAttributes.emotion).forEach(emotion => {
                  var emotionVal = data[0].faceAttributes.emotion[emotion];
                  if (emotionVal > maxEmotionVal) {
                    maxEmotionVal = emotionVal;
                    maxEmotion = emotion;
                  }
                });

                this.setState({ emotion: maxEmotion });
              })
              .catch(err => {
                console.log("err", err);
              });
          });
      });
    }
  };

  render() {
    const { hasCameraPermission } = this.state;
    if (hasCameraPermission === null) {
      return <View />;
    } else if (hasCameraPermission === false) {
      return <Text>No access to camera</Text>;
    } else {
      return (
        <View style={{ flex: 1 }}>
          <Camera
            style={{ flex: 1 }}
            type={this.state.type}
            ref={ref => {
              this.camera = ref;
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "transparent",
                flexDirection: "row"
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 0.33,
                  alignSelf: "flex-end",
                  alignItems: "center"
                }}
                onPress={() => {
                  this.setState({
                    type:
                      this.state.type === Camera.Constants.Type.back
                        ? Camera.Constants.Type.front
                        : Camera.Constants.Type.back
                  });
                }}
              >
                <Text
                  style={{ fontSize: 18, marginBottom: 10, color: "white" }}
                >
                  {" "}
                  Flip{" "}
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  flex: 0.33,
                  fontSize: 18,
                  marginBottom: 10,
                  color: "white",
                  alignSelf: "flex-end",
                  alignItems: "center"
                }}
              >
                {this.state.emotion}
              </Text>
              <TouchableOpacity
                style={{
                  flex: 0.33,
                  alignSelf: "flex-end",
                  alignItems: "center"
                }}
                onPress={this.takePicture.bind(this)}
              >
                <Text
                  style={{ fontSize: 18, marginBottom: 10, color: "white" }}
                >
                  {" "}
                  Snap{" "}
                </Text>
              </TouchableOpacity>
            </View>
          </Camera>
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  }
});
