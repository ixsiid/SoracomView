import React, { Component } from 'react';
import { StyleSheet, Text, Button, AsyncStorage, Dimensions, ScrollView } from 'react-native';
import { Container, Header, Content, Form, Item, Picker, Icon, Body, Title, Subtitle } from 'native-base';
import { AppLoading } from 'expo';
import {
	LineChart,
	BarChart,
	PieChart,
	ProgressChart,
	ContributionGraph,
	StackedBarChart
} from "react-native-chart-kit";

import ScatterLineChart from "./scatter-line-chart";

import { Subscribers } from './components';

const fetch = require('node-fetch');

import { authKeyId, authKey, resourceId } from './secret';

const SoracomError = function () {

};
SoracomError.isApiKeyError = code => {
	return ['AGW0002', 'AUM0013'].indexOf(code) >= 0;
};

class SoracomApiContainer extends Component {
	constructor(props) {
		super(props);

		/**
		 * apiKey: string,
		 * operatorId string,
		 * userName: string,
		 * token: string,
		 */
		this.apiManager = {};

		let retry = 0;
		this.request = (path, method = 'GET', payload = {}, apiKey = this.apiManager.apiKey, token = this.apiManager.token) => {
			const option = {
				method,
				headers: {
					'X-Soracom-API-Key': apiKey,
					'X-Soracom-Token': token
				}
			};
			if (method == 'POST' || method == 'PUT') option.body = JSON.stringify(payload);
			return fetch(`https://api.soracom.io/v1${path}`, option)
				.then(res => {
					if (res.status < 200 || res.status >= 300) throw { status: res.status, request: { path, method }, code: undefined };

					return { json: res.json(), response: res };
				})
				.then(({ json, response }) => {
					if (++retry > 2) throw { status: response.status, request: { path, method }, code: json.code };

					if (SoracomError.isApiKeyError(json.code)) {
						return this.getApiKey(true).then(_ => this.request(path, method, payload));
					}

					if ('code' in json) throw { status: response.status, request: { path, method }, code: json.code };
					retry = 0;

					//					alert(`${path}: ${JSON.stringify(json)} [${JSON.stringify(response)}]`);
					return json;
				});
		}
	}

	getApiKey(force = false) {
		const getNewApiKey = () => fetch('https://api.soracom.io/v1/auth', {
			method: 'POST',
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ authKeyId, authKey })
		})
			.then(res => ({ json: res.json(), response: res }))
			.then(({ json, response }) => {
				if (response.status < 200 || res.status >= 300) throw {
					status: response.status,
					request: { path: '/auth', method: 'GET' },
					code: json.code
				};

				if (json.code) throw {
					status: response.status,
					request: { path: '/auth', method: 'GET' },
					code: json.code
				};

				this.apiManager = json;
				return {
					store: AsyncStorage.setItem('@api:info', JSON.stringify(json)),
					api: json
				};
			})
			.then(({ store, api }) => api);

		if (force) return getNewApiKey();

		return AsyncStorage.getItem('@api:info')
			.then(text => {
				if (text == null) return getNewApiKey(true);

				const stored = JSON.parse(text);
				if (['userName', 'operatorId', 'apiKey', 'token'].find(x => !(x in stored))) {
					// 保存されたデータにキーが足らない
					return getNewApiKey(true);
				}

				// ユーザー情報をリクエストして、有効期限確認
				return this.request(`/operators/${stored.operatorId}/users/${stored.userName}`
					, 'GET', undefined, stored.apiKey, stored.token)
					.then(_ => AsyncStorage.getItem('@api:info'))
					.then(text => JSON.parse(text));
			});
	}

	componentDidMount() {
		this.getApiKey()
			.then(api => {
				alert('call child');
				alert(this.refs.length);
				Object.entries(this.refs)
					.filter(([k, v]) => v.setApiManager)
					.forEach(([k, v]) => {
						try {
							v.setApiManager({
								userName: api.userName,
								operatorId: api.operatorId,
								request: this.request,
							})
						} catch (e) {
							console.log(e);
							timeoutThrow(e);
						}
					});
			})
			.catch(_ => alert(JSON.stringify(_)));
	}

	render() {
		const children = React.Children.map(this.props.children,
			(child, index) => React.cloneElement(child, {
				ref: `child${index}`
			})
		);

		const title = [<Title key="title">{this.props.title}</Title>];
		if (this.props.withAuthName) {
			const authInfo = <AuthorizationInfo ref="info" />
			title.push(<Subtitle key="subtitle">{authInfo}</Subtitle>);
		}

		return (
			<Container>
				<Header><Body>{title}</Body></Header>
				<ScrollView>
					{children}
				</ScrollView>
			</Container>
		);
	}
}

class AuthorizationInfo extends Component {
	constructor(props) {
		super(props);
		this.state = { message: 'Authentication....' };
	}

	setApiManager(api) {
		if (!api) {
			this.setState({ message: `Failed to authenticate` });
			return;
		}
		this.setState({ message: `Authorization by ${api.userName} ::${api.operatorId}` });
	}

	render() {
		return (
			<Text>{this.state.message}</Text>
		);
	}

}

/*

class Resource extends Component {
	constructor(props) {
		super(props);
		this.state = {
			resources: [], selected: undefined,
			chart: { label: [], datasets: [{ dataX: [0, 1], data: [-1, 2] }] }
		};
		this.api = undefined;
	}

	setApiManager(api) {
		this.api = api;
		if (!api) return;
		api.request('/data/resources')
			.then(json => this.setState({
				resources: json.map(r => <Picker.Item key={r.resourceId}
					label={`${r.resourceId} ::${r.tags.name}`}
					value={r}
				/>)
			}))
			.catch(_ => alert(_));
	}

	onValueChange(args) {
		if (!this.api) return true;
		this.api.request(`/data/${args.resourceType}/${args.resourceId}?limit=100`)
			.then(array => {
				// undefinedの場合もあるかもしれない
				if (!array.length || array.length < 0) return;
				array.forEach(d => d.content = JSON.parse(d.content));

				const data = args.attributeNames.map(attr => {
					const filterd = array.filter(d => attr in d.content);
					return {
						dataX: filterd.map(d => d.time),
						data: filterd.map(d => d.content[attr]),
						color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
						strokeWidth: 4,
					};
				}).filter(d => d.data.length > 0);
				console.log({ chart: { label: [], datasets: data, legend: args.attributeNames } });
				this.setState({ chart: { label: [], datasets: data, legend: ["distance"] } });
			});

		return true;
	}

	render() {
		return (
			<Container>
				<Header><Body><Title>Data source</Title></Body></Header>
				<Content>
					<Form>
						<Item picker>
							<Picker
								mode="dropdown"
								iosIcon={<Icon name="arrow-down" />}
								style={{ width: '100%' }}
								placeholder="Select chart resource"
								placeholderStyle={{ color: "#bfc6ea" }}
								placeholderIconColor="#007aff"
								selectedValue={this.state.selected}
								onValueChange={this.onValueChange.bind(this)}
							>
								{this.state.resources}
							</Picker>
						</Item>
					</Form>
					<ScatterLineChart
						data={this.state.chart}
						width={Dimensions.get("window").width} // from react-native
						height={220}
						yAxisLabel=""
						yAxisSuffix=""
						yAxisInterval={1} // optional, defaults to 1
						chartConfig={{
							backgroundColor: "#e26a00",
							backgroundGradientFrom: "#fb8c00",
							backgroundGradientTo: "#ffa726",
							decimalPlaces: 2, // optional, defaults to 2dp
							color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
							labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
							style: {
								borderRadius: 16
							},
							propsForDots: {
								r: "6",
								strokeWidth: "2",
								stroke: "#ffa726"
							}
						}}
						bezier
						style={{
							marginVertical: 8,
							borderRadius: 16
						}}
					/>
				</Content>
			</Container>
		);
	}
}

*/

class DateTimeChart extends Component {
	constructor(props) {
		super(props);
		this.state = {
			chart: {
				label: [],
				datasets: [{ dataX: [0, 1], data: [0, 0] }]
			},
			title: `${props.resourceAttr} chart :: ${props.resourceId}`,
			lastUpdate: "undefined",
		};
		this.resource = {
			type: props.resourceType,
			id: props.resourceId,
			attribute: props.resourceAttr,
		};
		this.timer = null;
	}

	setApiManager(api) {
		if (!api) {
			if (this.timer) clearInterval(this.timer);
			this.timer = null;
			return;
		}
		api.request(`/data/${this.resource.type}/${this.resource.id}?limit=${this.props.limit ?? 100}`)
			.then(array => {
				// undefinedの場合もあるかもしれない
				if (!array.length || array.length < 0) return;
				const data = array.map(d => {
					const content = JSON.parse(d.content);
					return [d.time, content[this.resource.attribute]];
				}).filter(x => x[1] != undefined);

				if (data.length > 0) {
					const datasets = [{
						color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
						strokeWidth: 2,
						dataX: data.map(d => d[0]),
						data: data.map(d => d[1]),
					}];
					const labels = [];
					this.setState({
						chart: { labels, datasets },
						lastUpdate: new Date(data[0][0]).toLocaleString(),
					});
				} else {
					this.setState({
						lastUpdate: new Date().toLocaleString() + ' (fetch)',
					})
				}

			});

		if (!this.timer) {
			//			this.timer = setInterval(this.setApiManager.bind(this), 60 * 1000, api);
		}
	}

	componentWillUnmount() {
		if (!this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}

	onLayout(event) {
		this.setState({ chartWidth: parseInt(event.nativeEvent.layout.width) });
	}

	render() {
		return (
			<Content style={this.props.style} onLayout={event => this.onLayout(event)}>
				<Text>{this.state.title}</Text>
				<ScatterLineChart
					data={this.state.chart}
					width={this.state.chartWidth || (Dimensions.get("window").width - 8)} // from react-native
					height={220}
					yAxisLabel=""
					yAxisSuffix=""
					chartConfig={{
						backgroundColor: "#e26a00",
						backgroundGradientFrom: "#fb8c00",
						backgroundGradientTo: "#ffa726",
						decimalPlaces: 2, // optional, defaults to 2dp
						color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
						labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
						style: {
							borderRadius: 16
						},
						propsForDots: {
							r: "1",
							strokeWidth: "2",
							stroke: "#ffa726"
						}
					}}
					bezier
					style={{
						marginVertical: 8,
						borderRadius: 8
					}}
				/>
				<Text style={{ textAlign: "right" }}>Last update by {this.state.lastUpdate}</Text>
			</Content>
		);
	}
}


export default class App extends Component {
	constructor(props) {
		super(props);
		this.state = { ready: false };
	}

	async loadResourcesAsync() {
		return Expo.Font.loadAsync({
			Roboto: require('./node_modules/native-base/Fonts/Roboto.ttf'),
			Roboto_medium: require('./node_modules/native-base/Fonts/Roboto_medium.ttf'),
		});
	}

	click() {
		alert('click');
		AsyncStorage.getItem('@api:info').
			then(a => {
				const api = JSON.parse(a);
				api.token = 'abcdefg';
				return AsyncStorage.setItem('@api:info', JSON.stringify(api));
			})
			.then(_ => alert('rewrited'))
			.catch(_ => alert('rewrite error'));
		//		AsyncStorage.setItem('@api:info', JSON.stringify(this.apiManager));
	}

	render() {
		if (!this.state.ready) {
			return <AppLoading
				startAsync={this.loadResourcesAsync}
				onFinish={() => this.setState({ ready: true })}
				onError={console.warn}
			/>;
		}

		return (
			<SoracomApiContainer title="SORACOM Harvest Data Viewer" withAuthName>
				<Subscribers style={{ backgroundColor: '#aaa', margin: 4 }} />
				<DateTimeChart
					style={{ backgroundColor: '#eee', margin: 4 }}
					resourceType="Device"
					resourceId={resourceId}
					resourceAttr="distance" />
				<Button onPress={() => this.click()} title="aaaaa"></Button>
			</SoracomApiContainer>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
});
