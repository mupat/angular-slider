(function() {
  var MODULE_NAME, SLIDER_TAG, angularize, bindHtml, dimension, gap, getOffset, hide, inputEvents, isHorizontal, module, pixelize, qualifiedDirectiveDefinition, roundStep, setOffset, show, sliderDirective;
  MODULE_NAME = 'uiSlider';
  SLIDER_TAG = 'slider';
  isHorizontal = function(orientation) {
    return orientation === 'horizontal';
  };
  angularize = function(element) {
    return angular.element(element);
  };
  pixelize = function(position) {
    return "" + position + "px";
  };
  hide = function(element) {
    return element.css({
      opacity: 0
    });
  };
  show = function(element) {
    return element.css({
      opacity: 1
    });
  };
  setOffset = function(orientation, element, position) {
    if (isHorizontal(orientation)) {
      return element.css({
        left: position
      });
    } else {
      return element.css({
        top: position
      });
    }
  };
  getOffset = function(orientation, element) {
    if (isHorizontal(orientation)) {
      return element[0].offsetLeft;
    } else {
      return element[0].offsetTop;
    }
  };
  dimension = function(orientation, element) {
    if (isHorizontal(orientation)) {
      return element[0].offsetWidth;
    } else {
      return element[0].offsetHeight;
    }
  };
  gap = function(orientation, element1, element2) {
    return getOffset(orientation, element2) - getOffset(orientation, element1) - dimension(orientation, element1);
  };
  bindHtml = function(element, html) {
    return element.attr('ng-bind-html-unsafe', html);
  };
  roundStep = function(value, precision, step, floor) {
    var decimals, remainder, roundedValue, steppedValue;
    if (floor == null) {
      floor = 0;
    }
    if (step == null) {
      step = 1 / Math.pow(10, precision);
    }
    remainder = (value - floor) % step;
    steppedValue = remainder > (step / 2) ? value + step - remainder : value - remainder;
    decimals = Math.pow(10, precision);
    roundedValue = steppedValue * decimals / decimals;
    return roundedValue.toFixed(precision);
  };
  inputEvents = {
    mouse: {
      start: 'mousedown',
      move: 'mousemove',
      end: 'mouseup'
    },
    touch: {
      start: 'touchstart',
      move: 'touchmove',
      end: 'touchend'
    }
  };
  sliderDirective = function($timeout) {
    return {
      restrict: 'EA',
      scope: {
        floor: '@',
        ceiling: '@',
        step: '@',
        precision: '@',
        minRange: '@',
        ngModel: '=?',
        ngModelLow: '=?',
        ngModelHigh: '=?',
        ngModelRange: '=?',
        translate: '&'
      },
      template: '<span class="bar"></span><span class="bar selection"></span><span class="bar selection-drag-handle"></span><span class="pointer"></span><span class="pointer"></span><span class="bubble selection"></span><span ng-bind-html-unsafe="translate({value: floor})" class="bubble limit"></span><span ng-bind-html-unsafe="translate({value: ceiling})" class="bubble limit"></span><span class="bubble"></span><span class="bubble"></span><span class="bubble"></span>',
      compile: function(element, attributes) {
        var ceilBub, cmbBub, e, flrBub, fullBar, highBub, lowBub, maxPtr, minPtr, orientation, range, refHigh, refLow, selBar, selBub, selDragHandleBar, watchables, _i, _len, _ref, _ref2, _ref3;
        if (attributes.translate) {
          attributes.$set('translate', "" + attributes.translate + "(value)");
        }
        range = !(attributes.ngModel != null) && ((attributes.ngModelLow != null) && (attributes.ngModelHigh != null));
        orientation = (_ref = attributes.orientation) != null ? _ref : 'horizontal';
        _ref2 = (function() {
          var _i, _len, _ref2, _results;
          _ref2 = element.children();
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            e = _ref2[_i];
            _results.push(angularize(e));
          }
          return _results;
        })(), fullBar = _ref2[0], selBar = _ref2[1], selDragHandleBar = _ref2[2], minPtr = _ref2[3], maxPtr = _ref2[4], selBub = _ref2[5], flrBub = _ref2[6], ceilBub = _ref2[7], lowBub = _ref2[8], highBub = _ref2[9], cmbBub = _ref2[10];
        refLow = range ? 'ngModelLow' : 'ngModel';
        refHigh = 'ngModelHigh';
        bindHtml(selBub, "'Range: ' + translate({value: diff})");
        bindHtml(lowBub, "translate({value: " + refLow + "})");
        bindHtml(highBub, "translate({value: " + refHigh + "})");
        bindHtml(cmbBub, "translate({value: " + refLow + "}) + ' - ' + translate({value: " + refHigh + "})");
        if (!range) {
          _ref3 = [selBar, selDragHandleBar, maxPtr, selBub, highBub, cmbBub];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            element = _ref3[_i];
            element.remove();
          }
        }
        watchables = [refLow, 'floor', 'ceiling', 'minRange', 'ngModelRange'];
        if (range) {
          watchables.push(refHigh);
        }
        return {
          post: function(scope, element, attributes) {
            var barWidth, boundToInputs, dimensions, maxOffset, maxValue, minOffset, minValue, ngDocument, offsetRange, pointerHalfWidth, updateDOM, valueRange, w, _j, _len2;
            boundToInputs = false;
            ngDocument = angularize(document);
            if (!attributes.translate) {
              scope.translate = function(value) {
                return value.value;
              };
            }
            pointerHalfWidth = barWidth = minOffset = maxOffset = minValue = maxValue = valueRange = offsetRange = void 0;
            dimensions = function() {
              var value, _j, _len2, _ref4, _ref5;
              if ((_ref4 = scope.precision) == null) {
                scope.precision = 0;
              }
              if ((_ref5 = scope.step) == null) {
                scope.step = 1;
              }
              for (_j = 0, _len2 = watchables.length; _j < _len2; _j++) {
                value = watchables[_j];
                scope[value] = roundStep(parseFloat(scope[value]), parseInt(scope.precision), parseFloat(scope.step), parseFloat(scope.floor));
              }
              scope.diff = roundStep(scope[refHigh] - scope[refLow], parseInt(scope.precision), parseFloat(scope.step), parseFloat(scope.floor));
              pointerHalfWidth = dimension(orientation, minPtr) / 2;
              barWidth = dimension(orientation, fullBar);
              minOffset = 0;
              maxOffset = barWidth - dimension(orientation, minPtr);
              minValue = parseFloat(attributes.floor);
              maxValue = parseFloat(attributes.ceiling);
              valueRange = maxValue - minValue;
              return offsetRange = maxOffset - minOffset;
            };
            updateDOM = function() {
              var adjustBubbles, bindPointerEvents, bindSelectionBarEvents, checkConstraint, checkRangeConstraints, ensureMinAndFixedRange, fitToBar, getPointerOffset, percentOffset, percentToOffset, percentToValue, percentValue, setBindings, setPointers;
              dimensions();
              getPointerOffset = function(orientation, e) {
                var checkTouch, prop;
                if (isHorizontal(orientation)) {
                  prop = 'clientX';
                } else {
                  prop = 'clientY';
                }
                if (e[prop]) {
                  return e[prop];
                }
                checkTouch = function(e) {
                  if (e.touches && e.touches[0] && e.touches[0][prop]) {
                    return e.touches[0][prop];
                  } else {
                    return false;
                  }
                };
                if (checkTouch(e)) {
                  return checkTouch(e);
                }
                if (checkTouch(e.originalEvent)) {
                  return checkTouch(e.originalEvent);
                }
                return false;
              };
              percentOffset = function(offset) {
                return ((offset - minOffset) / offsetRange) * 100;
              };
              percentValue = function(value) {
                return ((value - minValue) / valueRange) * 100;
              };
              percentToOffset = function(percent) {
                return pixelize(percent * offsetRange / 100);
              };
              percentToValue = function(percent) {
                return (maxValue - minValue) * percent / 100 + minValue;
              };
              fitToBar = function(element) {
                return setOffset(orientation, element, pixelize(Math.min(Math.max(0, getOffset(orientation, element)), barWidth - dimension(orientation, element))));
              };
              checkConstraint = function(ref) {
                if (scope[ref] < minValue || scope[ref] > maxValue) {
                  scope[ref] = Math.min(maxValue, Math.max(minValue, scope[ref]));
                  return true;
                }
                return false;
              };
              checkRangeConstraints = function() {
                var uH, uL;
                uL = checkConstraint(refLow);
                if (range) {
                  uH = checkConstraint(refHigh);
                }
                return uL || uH;
              };
              setPointers = function() {
                var bar, newHighValue, newLowValue, _fn, _j, _len2, _ref4;
                setOffset(orientation, ceilBub, pixelize(barWidth - dimension(orientation, ceilBub)));
                newLowValue = percentValue(scope[refLow]);
                setOffset(orientation, minPtr, percentToOffset(newLowValue));
                setOffset(orientation, lowBub, pixelize(getOffset(orientation, minPtr) - dimension(orientation, lowBub) / 2 + pointerHalfWidth));
                if (range) {
                  newHighValue = percentValue(scope[refHigh]);
                  setOffset(orientation, maxPtr, percentToOffset(newHighValue));
                  setOffset(orientation, highBub, pixelize(getOffset(orientation, maxPtr) - dimension(orientation, highBub) / 2 + pointerHalfWidth));
                  _ref4 = [selBar, selDragHandleBar];
                  _fn = function(bar) {
                    setOffset(orientation, bar, pixelize(getOffset(orientation, minPtr) + pointerHalfWidth));
                    if (isHorizontal(orientation)) {
                      return bar.css({
                        width: percentToOffset(newHighValue - newLowValue)
                      });
                    } else {
                      return bar.css({
                        height: percentToOffset(newHighValue - newLowValue)
                      });
                    }
                  };
                  for (_j = 0, _len2 = _ref4.length; _j < _len2; _j++) {
                    bar = _ref4[_j];
                    _fn(bar);
                  }
                  setOffset(orientation, selBub, pixelize(getOffset(orientation, selBar) + dimension(orientation, selBar) / 2 - dimension(orientation, selBub) / 2));
                  return setOffset(orientation, cmbBub, pixelize(getOffset(orientation, selBar) + dimension(orientation, selBar) / 2 - dimension(orientation, cmbBub) / 2));
                }
              };
              adjustBubbles = function() {
                var bubToAdjust;
                fitToBar(lowBub);
                bubToAdjust = highBub;
                if (range) {
                  fitToBar(highBub);
                  fitToBar(selBub);
                  if (gap(orientation, lowBub, highBub) < 10) {
                    hide(lowBub);
                    hide(highBub);
                    fitToBar(cmbBub);
                    show(cmbBub);
                    bubToAdjust = cmbBub;
                  } else {
                    show(lowBub);
                    show(highBub);
                    hide(cmbBub);
                    bubToAdjust = highBub;
                  }
                }
                if (gap(orientation, flrBub, lowBub) < 5) {
                  hide(flrBub);
                } else {
                  if (range) {
                    if (gap(orientation, flrBub, bubToAdjust) < 5) {
                      hide(flrBub);
                    } else {
                      show(flrBub);
                    }
                  } else {
                    show(flrBub);
                  }
                }
                if (gap(orientation, lowBub, ceilBub) < 5) {
                  return hide(ceilBub);
                } else {
                  if (range) {
                    if (gap(orientation, bubToAdjust, ceilBub) < 5) {
                      return hide(ceilBub);
                    } else {
                      return show(ceilBub);
                    }
                  } else {
                    return show(ceilBub);
                  }
                }
              };
              ensureMinAndFixedRange = function(ref, newValue) {
                var ensureMinRange, fixedRange, minRange, newHigh, newLow;
                minRange = parseInt(scope.minRange, 10);
                fixedRange = parseInt(scope.ngModelRange, 10);
                if (!(minRange || fixedRange)) {
                  return false;
                }
                if (ref === refLow) {
                  ensureMinRange = scope[refHigh] - newValue < minRange;
                } else {
                  ensureMinRange = newValue - scope[refLow] < minRange;
                }
                if (fixedRange || ensureMinRange) {
                  if (ref === refLow) {
                    newHigh = newValue + (fixedRange || minRange);
                    newLow = newValue;
                    if (newHigh > maxValue) {
                      newLow -= newHigh - maxValue;
                      newLow = Math.max(minValue, newLow);
                      newHigh = maxValue;
                    }
                  } else {
                    newHigh = newValue;
                    newLow = newValue - (fixedRange || minRange);
                    if (newLow < minValue) {
                      newHigh += minValue - newLow;
                      newHigh = Math.min(maxValue, newHigh);
                      newLow = minValue;
                    }
                  }
                  newHigh = roundStep(newHigh, parseInt(scope.precision), parseFloat(scope.step), parseFloat(scope.floor));
                  scope[refHigh] = newHigh;
                  newLow = roundStep(newLow, parseInt(scope.precision), parseFloat(scope.step), parseFloat(scope.floor));
                  return scope[refLow] = newLow;
                }
              };
              bindPointerEvents = function(pointer, ref, events) {
                var onEnd, onMove, onStart;
                onEnd = function() {
                  var ptr, _j, _len2, _ref4;
                  _ref4 = [minPtr, maxPtr];
                  for (_j = 0, _len2 = _ref4.length; _j < _len2; _j++) {
                    ptr = _ref4[_j];
                    ptr.removeClass('active');
                  }
                  ngDocument.unbind(events.move);
                  return ngDocument.unbind(events.end);
                };
                onMove = function(event) {
                  var eventX, newOffset, newPercent, newValue;
                  eventX = getPointerOffset(orientation, event);
                  newOffset = eventX - pointerHalfWidth;
                  if (isHorizontal(orientation)) {
                    newOffset -= element[0].getBoundingClientRect().left;
                  } else {
                    newOffset -= element[0].getBoundingClientRect().top;
                  }
                  newPercent = percentOffset(newOffset);
                  newValue = minValue + (valueRange * newPercent / 100.0);
                  if (range && !ensureMinAndFixedRange(ref, newValue)) {
                    if (ref === refLow) {
                      if (newValue > scope[refHigh]) {
                        ref = refHigh;
                        minPtr.removeClass('active');
                        maxPtr.addClass('active');
                      }
                    } else {
                      if (newValue < scope[refLow]) {
                        ref = refLow;
                        maxPtr.removeClass('active');
                        minPtr.addClass('active');
                      }
                    }
                    newValue = roundStep(newValue, parseInt(scope.precision), parseFloat(scope.step), parseFloat(scope.floor));
                    scope[ref] = newValue;
                  } else {
                    newValue = roundStep(newValue, parseInt(scope.precision), parseFloat(scope.step), parseFloat(scope.floor));
                    scope[ref] = newValue;
                  }
                  checkConstraint(ref);
                  return scope.$apply();
                };
                onStart = function(event) {
                  pointer.addClass('active');
                  dimensions();
                  event.stopPropagation();
                  event.preventDefault();
                  ngDocument.bind(events.move, onMove);
                  return ngDocument.bind(events.end, onEnd);
                };
                return pointer.bind(events.start, onStart);
              };
              bindSelectionBarEvents = function(selBar, events) {
                var offsetHighStart, offsetLowStart, offsetPointerStart, onEnd, onMove, onStart;
                offsetPointerStart = void 0;
                offsetLowStart = void 0;
                offsetHighStart = void 0;
                onStart = function(event) {
                  event.stopPropagation();
                  event.preventDefault();
                  offsetPointerStart = getPointerOffset(orientation, event);
                  offsetLowStart = parseInt(percentToOffset(percentValue(scope[refLow], 10)));
                  offsetHighStart = parseInt(percentToOffset(percentValue(scope[refHigh], 10)));
                  ngDocument.bind(events.move, onMove);
                  return ngDocument.bind(events.end, onEnd);
                };
                onMove = function(event) {
                  var offsetHighCurrent, offsetLowCurrent, offsetPointerCurrent, offsetPointerDelta, valueHighCurrent, valueLowCurrent;
                  offsetPointerCurrent = getPointerOffset(orientation, event);
                  offsetPointerDelta = offsetPointerCurrent - offsetPointerStart;
                  offsetLowCurrent = offsetLowStart + offsetPointerDelta;
                  offsetHighCurrent = offsetHighStart + offsetPointerDelta;
                  if (offsetLowCurrent < minOffset) {
                    offsetLowCurrent = minOffset;
                    offsetHighCurrent = offsetLowCurrent + (offsetHighStart - offsetLowStart);
                  }
                  if (offsetHighCurrent > maxOffset) {
                    offsetHighCurrent = maxOffset;
                    offsetLowCurrent = offsetHighCurrent + (offsetLowStart - offsetHighStart);
                  }
                  valueLowCurrent = percentToValue(percentOffset(offsetLowCurrent));
                  valueHighCurrent = percentToValue(percentOffset(offsetHighCurrent));
                  scope[refLow] = valueLowCurrent;
                  scope[refHigh] = valueHighCurrent;
                  return scope.$apply();
                };
                onEnd = function() {
                  ngDocument.unbind(events.move);
                  return ngDocument.unbind(events.end);
                };
                return selBar.bind(events.start, onStart);
              };
              setBindings = function() {
                var bind, inputMethod, _j, _k, _len2, _len3, _ref4, _ref5, _results;
                boundToInputs = true;
                bind = function(method) {
                  bindPointerEvents(minPtr, refLow, inputEvents[method]);
                  return bindPointerEvents(maxPtr, refHigh, inputEvents[method]);
                };
                _ref4 = ['touch', 'mouse'];
                for (_j = 0, _len2 = _ref4.length; _j < _len2; _j++) {
                  inputMethod = _ref4[_j];
                  bind(inputMethod);
                }
                if (range) {
                  _ref5 = ['touch', 'mouse'];
                  _results = [];
                  for (_k = 0, _len3 = _ref5.length; _k < _len3; _k++) {
                    inputMethod = _ref5[_k];
                    _results.push((function(method) {
                      return bindSelectionBarEvents(selDragHandleBar, inputEvents[method]);
                    })(inputMethod));
                  }
                  return _results;
                }
              };
              if (checkRangeConstraints()) {
                scope.$apply();
              }
              setPointers();
              adjustBubbles();
              ensureMinAndFixedRange(refLow, parseInt(scope[refLow], 10));
              if (!boundToInputs) {
                return setBindings();
              }
            };
            $timeout(updateDOM);
            for (_j = 0, _len2 = watchables.length; _j < _len2; _j++) {
              w = watchables[_j];
              scope.$watch(w, updateDOM);
            }
            return window.addEventListener("resize", updateDOM);
          }
        };
      }
    };
  };
  qualifiedDirectiveDefinition = ['$timeout', sliderDirective];
  module = function(window, angular) {
    return angular.module(MODULE_NAME, []).directive(SLIDER_TAG, qualifiedDirectiveDefinition);
  };
  module(window, window.angular);
}).call(this);
