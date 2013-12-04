(function() {
  var MODULE_NAME, SLIDER_TAG, angularize, bindHtml, gap, halfWidth, hide, inputEvents, module, offset, offsetLeft, pixelize, qualifiedDirectiveDefinition, roundStep, show, sliderDirective, width;
  MODULE_NAME = 'uiSlider';
  SLIDER_TAG = 'slider';
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
  offset = function(element, position) {
    return element.css({
      left: position
    });
  };
  halfWidth = function(element) {
    return element[0].offsetWidth / 2;
  };
  offsetLeft = function(element) {
    return element[0].offsetLeft;
  };
  width = function(element) {
    return element[0].offsetWidth;
  };
  gap = function(element1, element2) {
    return offsetLeft(element2) - offsetLeft(element1) - width(element1);
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
        var ceilBub, cmbBub, e, flrBub, fullBar, highBub, lowBub, maxPtr, minPtr, range, refHigh, refLow, selBar, selBub, selDragHandleBar, watchables, _i, _len, _ref, _ref2;
        if (attributes.translate) {
          attributes.$set('translate', "" + attributes.translate + "(value)");
        }
        range = !(attributes.ngModel != null) && ((attributes.ngModelLow != null) && (attributes.ngModelHigh != null));
        _ref = (function() {
          var _i, _len, _ref, _results;
          _ref = element.children();
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            e = _ref[_i];
            _results.push(angularize(e));
          }
          return _results;
        })(), fullBar = _ref[0], selBar = _ref[1], selDragHandleBar = _ref[2], minPtr = _ref[3], maxPtr = _ref[4], selBub = _ref[5], flrBub = _ref[6], ceilBub = _ref[7], lowBub = _ref[8], highBub = _ref[9], cmbBub = _ref[10];
        refLow = range ? 'ngModelLow' : 'ngModel';
        refHigh = 'ngModelHigh';
        bindHtml(selBub, "'Range: ' + translate({value: diff})");
        bindHtml(lowBub, "translate({value: " + refLow + "})");
        bindHtml(highBub, "translate({value: " + refHigh + "})");
        bindHtml(cmbBub, "translate({value: " + refLow + "}) + ' - ' + translate({value: " + refHigh + "})");
        if (!range) {
          _ref2 = [selBar, selDragHandleBar, maxPtr, selBub, highBub, cmbBub];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            element = _ref2[_i];
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
              var value, _j, _len2, _ref3, _ref4;
              if ((_ref3 = scope.precision) == null) {
                scope.precision = 0;
              }
              if ((_ref4 = scope.step) == null) {
                scope.step = 1;
              }
              for (_j = 0, _len2 = watchables.length; _j < _len2; _j++) {
                value = watchables[_j];
                scope[value] = roundStep(parseFloat(scope[value]), parseInt(scope.precision), parseFloat(scope.step), parseFloat(scope.floor));
              }
              scope.diff = roundStep(scope[refHigh] - scope[refLow], parseInt(scope.precision), parseFloat(scope.step), parseFloat(scope.floor));
              pointerHalfWidth = halfWidth(minPtr);
              barWidth = width(fullBar);
              minOffset = 0;
              maxOffset = barWidth - width(minPtr);
              minValue = parseFloat(attributes.floor);
              maxValue = parseFloat(attributes.ceiling);
              valueRange = maxValue - minValue;
              return offsetRange = maxOffset - minOffset;
            };
            updateDOM = function() {
              var adjustBubbles, bindPointerEvents, bindSelectionBarEvents, checkConstraint, checkRangeConstraints, ensureMinAndFixedRange, fitToBar, getX, percentOffset, percentToOffset, percentToValue, percentValue, setBindings, setPointers;
              dimensions();
              getX = function(e) {
                var checkTouch;
                if (e.clientX) {
                  return e.clientX;
                }
                checkTouch = function(e) {
                  if (e.touches && e.touches[0] && e.touches[0].clientX) {
                    return e.touches[0].clientX;
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
                return offset(element, pixelize(Math.min(Math.max(0, offsetLeft(element)), barWidth - width(element))));
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
                var bar, newHighValue, newLowValue, _fn, _j, _len2, _ref3;
                offset(ceilBub, pixelize(barWidth - width(ceilBub)));
                newLowValue = percentValue(scope[refLow]);
                offset(minPtr, percentToOffset(newLowValue));
                offset(lowBub, pixelize(offsetLeft(minPtr) - (halfWidth(lowBub)) + pointerHalfWidth));
                if (range) {
                  newHighValue = percentValue(scope[refHigh]);
                  offset(maxPtr, percentToOffset(newHighValue));
                  offset(highBub, pixelize(offsetLeft(maxPtr) - (halfWidth(highBub)) + pointerHalfWidth));
                  _ref3 = [selBar, selDragHandleBar];
                  _fn = function(bar) {
                    offset(bar, pixelize(offsetLeft(minPtr) + pointerHalfWidth));
                    return bar.css({
                      width: percentToOffset(newHighValue - newLowValue)
                    });
                  };
                  for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
                    bar = _ref3[_j];
                    _fn(bar);
                  }
                  offset(selBub, pixelize(offsetLeft(selBar) + halfWidth(selBar) - halfWidth(selBub)));
                  return offset(cmbBub, pixelize(offsetLeft(selBar) + halfWidth(selBar) - halfWidth(cmbBub)));
                }
              };
              adjustBubbles = function() {
                var bubToAdjust;
                fitToBar(lowBub);
                bubToAdjust = highBub;
                if (range) {
                  fitToBar(highBub);
                  fitToBar(selBub);
                  if (gap(lowBub, highBub) < 10) {
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
                if (gap(flrBub, lowBub) < 5) {
                  hide(flrBub);
                } else {
                  if (range) {
                    if (gap(flrBub, bubToAdjust) < 5) {
                      hide(flrBub);
                    } else {
                      show(flrBub);
                    }
                  } else {
                    show(flrBub);
                  }
                }
                if (gap(lowBub, ceilBub) < 5) {
                  return hide(ceilBub);
                } else {
                  if (range) {
                    if (gap(bubToAdjust, ceilBub) < 5) {
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
                  var ptr, _j, _len2, _ref3;
                  _ref3 = [minPtr, maxPtr];
                  for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
                    ptr = _ref3[_j];
                    ptr.removeClass('active');
                  }
                  ngDocument.unbind(events.move);
                  return ngDocument.unbind(events.end);
                };
                onMove = function(event) {
                  var eventX, newOffset, newPercent, newValue;
                  eventX = getX(event);
                  newOffset = eventX - element[0].getBoundingClientRect().left - pointerHalfWidth;
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
                  offsetPointerStart = getX(event);
                  offsetLowStart = parseInt(percentToOffset(percentValue(scope[refLow], 10)));
                  offsetHighStart = parseInt(percentToOffset(percentValue(scope[refHigh], 10)));
                  ngDocument.bind(events.move, onMove);
                  return ngDocument.bind(events.end, onEnd);
                };
                onMove = function(event) {
                  var offsetHighCurrent, offsetLowCurrent, offsetPointerCurrent, offsetPointerDelta, valueHighCurrent, valueLowCurrent;
                  offsetPointerCurrent = getX(event);
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
                var bind, inputMethod, _j, _k, _len2, _len3, _ref3, _ref4, _results;
                boundToInputs = true;
                bind = function(method) {
                  bindPointerEvents(minPtr, refLow, inputEvents[method]);
                  return bindPointerEvents(maxPtr, refHigh, inputEvents[method]);
                };
                _ref3 = ['touch', 'mouse'];
                for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
                  inputMethod = _ref3[_j];
                  bind(inputMethod);
                }
                if (range) {
                  _ref4 = ['touch', 'mouse'];
                  _results = [];
                  for (_k = 0, _len3 = _ref4.length; _k < _len3; _k++) {
                    inputMethod = _ref4[_k];
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
