import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Animated,
  TextInput
} from "react-native";
import {
  Svg,
  Circle,
  Polygon,
  Polyline,
  Path,
  Rect,
  G
} from "react-native-svg";
import { AbstractChart } from "react-native-chart-kit"
import { LegendItem } from "./legend-item";

let AnimatedCircle = Animated.createAnimatedComponent(Circle);

class ScatterLineChart extends AbstractChart {
  label = React.createRef();

  state = {
    scrollableDotHorizontalOffset: new Animated.Value(0)
  };

  getColor = (dataset, opacity) => {
    return (dataset.color || this.props.chartConfig.color)(opacity);
  };

  getStrokeWidth = dataset => {
    return dataset.strokeWidth || this.props.chartConfig.strokeWidth || 3;
  };

  getDatas = data =>
    data.reduce((acc, item) => (item.data ? [...acc, ...item.data] : acc), []);

  getPropsForDots = (x, i) => {
    const { getDotProps, chartConfig = {} } = this.props;
    if (typeof getDotProps === "function") {
      return getDotProps(x, i);
    }
    const { propsForDots = {} } = chartConfig;
    return { r: "4", ...propsForDots };
  };

  renderScrollableDot = config => {
    const {
      data,
      width,
      height,
      paddingTop,
      paddingRight,
      scrollableDotHorizontalOffset,
      scrollableDotFill,
      scrollableDotStrokeColor,
      scrollableDotStrokeWidth,
      scrollableDotRadius,
      scrollableInfoViewStyle,
      scrollableInfoTextStyle,
      scrollableInfoSize,
      scrollableInfoOffset
    } = config;
    const output = [];
    const datas = this.getDatas(data);
    const baseHeight = this.calcBaseHeight(datas, height);

    let vl = [];

    const perData = width / data[0].data.length;
    for (let index = 0; index < data[0].data.length; index++) {
      vl.push(index * perData);
    }
    let lastIndex;

    scrollableDotHorizontalOffset.addListener(value => {
      const index = value.value / perData;
      if (!lastIndex) {
        lastIndex = index;
      }

      let abs = Math.floor(index);
      let percent = index - abs;
      abs = data[0].data.length - abs - 1;

      if (index >= data[0].data.length - 1) {
        this.label.current.setNativeProps({
          text: `${Math.floor(data[0].data[0])}`
        });
      } else {
        if (index > lastIndex) {
          // to right

          const base = data[0].data[abs];
          const prev = data[0].data[abs - 1];
          if (prev > base) {
            let rest = prev - base;
            this.label.current.setNativeProps({
              text: `${Math.floor(base + percent * rest)}`
            });
          } else {
            let rest = base - prev;
            this.label.current.setNativeProps({
              text: `${Math.floor(base - percent * rest)}`
            });
          }
        } else {
          // to left

          const base = data[0].data[abs - 1];
          const next = data[0].data[abs];
          percent = 1 - percent;
          if (next > base) {
            let rest = next - base;
            this.label.current.setNativeProps({
              text: `${Math.floor(base + percent * rest)}`
            });
          } else {
            let rest = base - next;
            this.label.current.setNativeProps({
              text: `${Math.floor(base - percent * rest)}`
            });
          }
        }
      }
      lastIndex = index;
    });

    data.forEach(dataset => {
      if (dataset.withScrollableDot == false) return;

      const perData = width / dataset.data.length;
      let values = [];
      let yValues = [];
      let xValues = [];

      let yValuesLabel = [];
      let xValuesLabel = [];

      for (let index = 0; index < dataset.data.length; index++) {
        values.push(index * perData);
        const yval =
          ((baseHeight -
            this.calcHeight(
              dataset.data[dataset.data.length - index - 1],
              datas,
              height
            )) /
            4) *
          3 +
          paddingTop;
        yValues.push(yval);
        const xval =
          paddingRight +
          ((dataset.data.length - index - 1) * (width - paddingRight)) /
          dataset.data.length;
        xValues.push(xval);

        yValuesLabel.push(
          yval - (scrollableInfoSize.height + scrollableInfoOffset)
        );
        xValuesLabel.push(xval - scrollableInfoSize.width / 2);
      }

      const translateX = scrollableDotHorizontalOffset.interpolate({
        inputRange: values,
        outputRange: xValues,
        extrapolate: "clamp"
      });

      const translateY = scrollableDotHorizontalOffset.interpolate({
        inputRange: values,
        outputRange: yValues,
        extrapolate: "clamp"
      });

      const labelTranslateX = scrollableDotHorizontalOffset.interpolate({
        inputRange: values,
        outputRange: xValuesLabel,
        extrapolate: "clamp"
      });

      const labelTranslateY = scrollableDotHorizontalOffset.interpolate({
        inputRange: values,
        outputRange: yValuesLabel,
        extrapolate: "clamp"
      });

      output.push([
        <Animated.View
          key={Math.random()}
          style={[
            scrollableInfoViewStyle,
            {
              transform: [
                { translateX: labelTranslateX },
                { translateY: labelTranslateY }
              ],
              width: scrollableInfoSize.width,
              height: scrollableInfoSize.height
            }
          ]}
        >
          <TextInput
            onLayout={() => {
              this.label.current.setNativeProps({
                text: `${Math.floor(data[0].data[data[0].data.length - 1])}`
              });
            }}
            style={scrollableInfoTextStyle}
            ref={this.label}
          />
        </Animated.View>,
        <AnimatedCircle
          key={Math.random()}
          cx={translateX}
          cy={translateY}
          r={scrollableDotRadius}
          stroke={scrollableDotStrokeColor}
          strokeWidth={scrollableDotStrokeWidth}
          fill={scrollableDotFill}
        />
      ]);
    });

    return output;
  };

  renderLine = config => {
    if (this.props.bezier) {
      return this.renderBezierLine(config);
    }

    const {
      width,
      height,
      paddingRight,
      paddingTop,
      data,
      linejoinType
    } = config;
    const output = [];
    const datas = this.getDatas(data);
    const baseHeight = this.calcBaseHeight(datas, height);
    data.forEach((dataset, index) => {
      const points = dataset.data.map((d, i) => {
        const x =
          (i * (width - paddingRight)) / dataset.data.length + paddingRight;
        const y =
          ((baseHeight - this.calcHeight(d, datas, height)) / 4) * 3 +
          paddingTop;
        return `${x},${y}`;
      });
      output.push(
        <Polyline
          key={index}
          strokeLinejoin={linejoinType}
          points={points.join(" ")}
          fill="none"
          stroke={this.getColor(dataset, 0.2)}
          strokeWidth={this.getStrokeWidth(dataset)}
        />
      );
    });

    return output;
  };

  getBezierLinePoints = (dataset, config) => {
    const { width, height, paddingRight, paddingTop, data } = config;
    if (dataset.data.length === 0) {
      return "M0,0";
    }

    const datas = this.getDatas(data);

    let xmin = -1, xmax = 1;
    let xrange = 1;
    if (dataset.dataX.length > 0) {
      xmin = dataset.dataX[0];
      xmax = dataset.dataX[0];
      for (let i = 0; i < dataset.dataX.length; i++) {
        if (xmin > dataset.dataX[i]) xmin = dataset.dataX[i];
        if (xmax < dataset.dataX[i]) xmax = dataset.dataX[i];
      }
      xrange = (xmax - xmin) / (dataset.dataX.length - 1) * dataset.dataX.length;
    }
    const x = i => {
      return Math.floor(
        paddingRight + ((dataset.dataX[i] - xmin) / xrange * (width - paddingRight))
      );
    };
    const baseHeight = this.calcBaseHeight(datas, height);
    const y = i => {
      const yHeight = this.calcHeight(dataset.data[i], datas, height);
      return Math.floor(((baseHeight - yHeight) / 4) * 3 + paddingTop);
    };

    return [`M${x(0)},${y(0)}`]
      .concat(
        dataset.data.slice(0, -1).map((_, i) => {
          const x_mid = (x(i) + x(i + 1)) / 2;
          const y_mid = (y(i) + y(i + 1)) / 2;
          const cp_x1 = (x_mid + x(i)) / 2;
          const cp_x2 = (x_mid + x(i + 1)) / 2;
          return (
            `Q ${cp_x1}, ${y(i)}, ${x_mid}, ${y_mid}` +
            ` Q ${cp_x2}, ${y(i + 1)}, ${x(i + 1)}, ${y(i + 1)}`
          );
        })
      )
      .join(" ");
  };

  renderBezierLine = config => {
    return config.data.map((dataset, index) => {
      const result = this.getBezierLinePoints(dataset, config);
      return (
        <Path
          key={index}
          d={result}
          fill="none"
          stroke={this.getColor(dataset, 0.2)}
          strokeWidth={this.getStrokeWidth(dataset)}
        />
      );
    });
  };

  renderLegend = (width, legendOffset) => {
    const { legend, datasets } = this.props.data;
    const baseLegendItemX = width / (legend.length + 1);

    return legend.map((legendItem, i) => (
      <G key={Math.random()}>
        <LegendItem
          index={i}
          iconColor={this.getColor(datasets[i], 0.9)}
          baseLegendItemX={baseLegendItemX}
          legendText={legendItem}
          labelProps={{ ...this.getPropsForLabels() }}
          legendOffset={legendOffset}
        />
      </G>
    ));
  };

  render() {
    const {
      width,
      height,
      data,
      withScrollableDot = false,
      withInnerLines = true,
      withOuterLines = true,
      withHorizontalLabels = true,
      withVerticalLabels = true,
      style = {},
      decorator,
      onDataPointClick,
      verticalLabelRotation = 0,
      horizontalLabelRotation = 0,
      formatYLabel = yLabel => yLabel,
      formatXLabel = xLabel => xLabel,
      segments,
      transparent = false,
      chartConfig = {},
    } = this.props;
    const { scrollableDotHorizontalOffset } = this.state;
    const { labels = [] } = data;
    const {
      borderRadius = 0,
      paddingTop = 16,
      paddingRight = 64,
      margin = 0,
      marginRight = 0,
      paddingBottom = 0
    } = style;

    const config = {
      width,
      height,
      verticalLabelRotation,
      horizontalLabelRotation
    };

    const datas = this.getDatas(data.datasets);

    let count = Math.min(...datas) === Math.max(...datas) ? 1 : 4;
    if (segments) {
      count = segments;
    }

    const legendOffset = this.props.data.legend ? height * 0.15 : 0;

    return (
      <View style={style}>
        <Svg
          height={height + paddingBottom + legendOffset}
          width={width - margin * 2 - marginRight}
        >
          <Rect
            width="100%"
            height={height + legendOffset}
            rx={borderRadius}
            ry={borderRadius}
            fill="url(#backgroundGradient)"
            fillOpacity={transparent ? 0 : 1}
          />
          {this.props.data.legend &&
            this.renderLegend(config.width, legendOffset)}
          <G x="0" y={legendOffset}>
            {this.renderDefs({
              ...config,
              ...chartConfig,
              data: data.datasets
            })}
            <G>
              {withInnerLines
                ? this.renderHorizontalLines({
                  ...config,
                  count: count,
                  paddingTop,
                  paddingRight
                })
                : withOuterLines
                  ? this.renderHorizontalLine({
                    ...config,
                    paddingTop,
                    paddingRight
                  })
                  : null}
            </G>
            <G>
              {withHorizontalLabels
                ? this.renderHorizontalLabels({
                  ...config,
                  count: count,
                  data: datas,
                  paddingTop,
                  paddingRight,
                  formatYLabel,
                  decimalPlaces: chartConfig.decimalPlaces
                })
                : null}
            </G>
            <G>
              {withInnerLines
                ? this.renderVerticalLines({
                  ...config,
                  data: data.datasets[0].data,
                  paddingTop,
                  paddingRight
                })
                : withOuterLines
                  ? this.renderVerticalLine({
                    ...config,
                    paddingTop,
                    paddingRight
                  })
                  : null}
            </G>
            <G>
              {withVerticalLabels
                ? this.renderVerticalLabels({
                  ...config,
                  labels,
                  paddingRight,
                  paddingTop,
                  formatXLabel
                })
                : null}
            </G>
            <G>
              {this.renderLine({
                ...config,
                ...chartConfig,
                paddingRight,
                paddingTop,
                data: data.datasets
              })}
            </G>
            <G>
              {withScrollableDot &&
                this.renderScrollableDot({
                  ...config,
                  ...chartConfig,
                  data: data.datasets,
                  paddingTop,
                  paddingRight,
                  onDataPointClick,
                  scrollableDotHorizontalOffset
                })}
            </G>
            <G>
              {decorator &&
                decorator({
                  ...config,
                  data: data.datasets,
                  paddingTop,
                  paddingRight
                })}
            </G>
          </G>
        </Svg>
        {withScrollableDot && (
          <ScrollView
            style={StyleSheet.absoluteFill}
            contentContainerStyle={{ width: width * 2 }}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={Animated.event([
              {
                nativeEvent: {
                  contentOffset: { x: scrollableDotHorizontalOffset }
                }
              }
            ])}
            horizontal
            bounces={false}
          />
        )}
      </View>
    );
  }
}

export default ScatterLineChart;