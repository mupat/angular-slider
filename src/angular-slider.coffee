# CONSTANTS

MODULE_NAME = 'uiSlider'
SLIDER_TAG  = 'slider'

# HELPER FUNCTIONS

isHorizontal    = (orientation) -> orientation == 'horizontal'
angularize      = (element) -> angular.element element
pixelize        = (position) -> "#{position}px"
hide            = (element) -> element.css opacity: 0
show            = (element) -> element.css opacity: 1
setOffset       = (orientation, element, position) ->
    if isHorizontal orientation then element.css left: position else element.css top: position
getOffset       = (orientation, element) ->
    if isHorizontal orientation then element[0].offsetLeft else element[0].offsetTop
dimension       = (orientation, element) ->
    if isHorizontal orientation then element[0].offsetWidth else element[0].offsetHeight
gap             = (orientation, element1, element2) ->
    getOffset(orientation, element2) - getOffset(orientation, element1) - dimension(orientation, element1)
bindHtml        = (element, html) -> element.attr 'ng-bind-html-unsafe', html
roundStep       = (value, precision, step, floor = 0) ->
    step ?= 1 / Math.pow(10, precision)
    remainder = (value - floor) % step
    steppedValue =
        if remainder > (step / 2)
        then value + step - remainder
        else value - remainder
    decimals = Math.pow 10, precision
    roundedValue = steppedValue * decimals / decimals
    roundedValue.toFixed precision
inputEvents =
    mouse:
        start: 'mousedown'
        move:  'mousemove'
        end:   'mouseup'
    touch:
        start: 'touchstart'
        move:  'touchmove'
        end:   'touchend'

# DIRECTIVE DEFINITION

sliderDirective = ($timeout) ->
    restrict: 'EA'
    scope:
        floor:       '@'
        ceiling:     '@'
        step:        '@'
        precision:   '@'
        minRange:    '@'
        ngModel:     '=?'
        ngModelLow:  '=?'
        ngModelHigh: '=?'
        ngModelRange: '=?'
        translate:   '&'
    template: '<span class="bar"></span><span class="bar selection"></span><span class="bar selection-drag-handle"></span><span class="pointer"></span><span class="pointer"></span><span class="bubble selection"></span><span ng-bind-html-unsafe="translate({value: floor})" class="bubble limit"></span><span ng-bind-html-unsafe="translate({value: ceiling})" class="bubble limit"></span><span class="bubble"></span><span class="bubble"></span><span class="bubble"></span>'
    compile: (element, attributes) ->

        # Expand the translation function abbreviation
        attributes.$set 'translate', "#{attributes.translate}(value)" if attributes.translate

        # Check if it is a range slider
        range = !attributes.ngModel? and (attributes.ngModelLow? and attributes.ngModelHigh?)

        orientation = attributes.orientation ? 'horizontal';

        # Get references to template elements
        [fullBar, selBar, selDragHandleBar, minPtr, maxPtr, selBub,
            flrBub, ceilBub, lowBub, highBub, cmbBub] = (angularize(e) for e in element.children())
        
        # Shorthand references to the 2 model scopes
        refLow = if range then 'ngModelLow' else 'ngModel'
        refHigh = 'ngModelHigh'

        bindHtml selBub, "'Range: ' + translate({value: diff})"
        bindHtml lowBub, "translate({value: #{refLow}})"
        bindHtml highBub, "translate({value: #{refHigh}})"
        bindHtml cmbBub, "translate({value: #{refLow}}) + ' - ' + translate({value: #{refHigh}})"

        # Remove range specific elements if not a range slider
        unless range
            element.remove() for element in [selBar, selDragHandleBar, maxPtr, selBub, highBub, cmbBub]

        # Scope values to watch for changes
        watchables = [refLow, 'floor', 'ceiling', 'minRange', 'ngModelRange']
        watchables.push refHigh if range

        post: (scope, element, attributes) ->

            boundToInputs = false
            ngDocument = angularize document
            unless attributes.translate
                scope.translate = (value) -> value.value

            pointerHalfWidth = barWidth = minOffset = maxOffset = minValue = maxValue = valueRange = offsetRange = undefined

            dimensions = ->
                # roundStep the initial score values
                scope.precision ?= 0
                scope.step ?= 1
                scope[value] = roundStep(parseFloat(scope[value]), parseInt(scope.precision), parseFloat(scope.step), parseFloat(scope.floor)) for value in watchables
                scope.diff = roundStep(scope[refHigh] - scope[refLow], parseInt(scope.precision), parseFloat(scope.step), parseFloat(scope.floor))
                
                # Commonly used measurements
                pointerHalfWidth = dimension(orientation, minPtr) / 2
                barWidth = dimension orientation, fullBar

                minOffset = 0
                maxOffset = barWidth - dimension(orientation, minPtr)

                minValue = parseFloat attributes.floor
                maxValue = parseFloat attributes.ceiling

                valueRange = maxValue - minValue
                offsetRange = maxOffset - minOffset                

            updateDOM = ->
                dimensions()

                getPointerOffset = (orientation, e) ->
                    if isHorizontal orientation
                        prop = 'clientX'
                    else
                        prop = 'clientY'

                    # Desktop event
                    return e[prop] if e[prop]

                    checkTouch = (e) ->
                        if e.touches && e.touches[0] && e.touches[0][prop]
                            return e.touches[0][prop]
                        else
                            return false

                    # Touch events
                    return checkTouch e if checkTouch e
                    return checkTouch e.originalEvent if checkTouch e.originalEvent

                    return false

                # Translation functions
                percentOffset = (offset) -> ((offset - minOffset) / offsetRange) * 100
                percentValue = (value) -> ((value - minValue) / valueRange) * 100
                percentToOffset = (percent) -> pixelize percent * offsetRange / 100
                percentToValue = (percent) -> (maxValue - minValue) * percent / 100 + minValue

                # Fit bubble to bar width
                fitToBar = (element) -> setOffset orientation, element, pixelize(Math.min (Math.max 0, getOffset(orientation, element)), (barWidth - dimension(orientation, element)))

                checkConstraint = (ref) ->
                    if scope[ref] < minValue or scope[ref] > maxValue
                        scope[ref] = Math.min(maxValue, Math.max(minValue, scope[ref]))
                        return true

                    return false

                checkRangeConstraints = () ->
                    uL = checkConstraint(refLow)
                    uH = checkConstraint(refHigh) if range

                    return uL or uH

                setPointers = ->
                    setOffset orientation, ceilBub, pixelize(barWidth - dimension(orientation, ceilBub))
                    newLowValue = percentValue scope[refLow]
                    setOffset orientation, minPtr, percentToOffset newLowValue
                    setOffset orientation, lowBub, pixelize(getOffset(orientation, minPtr) - dimension(orientation, lowBub) / 2 + pointerHalfWidth)
                    if range
                        newHighValue = percentValue scope[refHigh]
                        setOffset orientation, maxPtr, percentToOffset newHighValue
                        setOffset orientation, highBub, pixelize(getOffset(orientation, maxPtr) - dimension(orientation, highBub) / 2 + pointerHalfWidth)

                        ((bar) ->
                            setOffset orientation, bar, pixelize(getOffset(orientation, minPtr) + pointerHalfWidth)
                            if isHorizontal orientation
                                bar.css width: percentToOffset newHighValue - newLowValue
                            else
                                bar.css height: percentToOffset newHighValue - newLowValue
                        )(bar) for bar in [selBar, selDragHandleBar]

                        setOffset orientation, selBub, pixelize(getOffset(orientation, selBar) + dimension(orientation, selBar) / 2 - dimension(orientation, selBub) / 2)
                        setOffset orientation, cmbBub, pixelize(getOffset(orientation, selBar) + dimension(orientation, selBar) / 2 - dimension(orientation, cmbBub) / 2)

                adjustBubbles = ->
                    fitToBar lowBub
                    bubToAdjust = highBub

                    if range
                        fitToBar highBub
                        fitToBar selBub

                        if gap(orientation, lowBub, highBub) < 10
                            hide lowBub
                            hide highBub
                            fitToBar cmbBub
                            show cmbBub
                            bubToAdjust = cmbBub
                        else
                            show lowBub
                            show highBub
                            hide cmbBub
                            bubToAdjust = highBub

                    if gap(orientation, flrBub, lowBub) < 5
                        hide flrBub
                    else
                        if range
                            if gap(orientation, flrBub, bubToAdjust) < 5 then hide flrBub else show flrBub
                        else
                            show flrBub
                    if gap(orientation, lowBub, ceilBub) < 5
                        hide ceilBub
                    else
                        if range
                            if gap(orientation, bubToAdjust, ceilBub) < 5 then hide ceilBub else show ceilBub
                        else
                            show ceilBub

                ensureMinAndFixedRange = (ref, newValue) ->
                    minRange = parseInt scope.minRange, 10
                    fixedRange = parseInt scope.ngModelRange, 10

                    if not (minRange or fixedRange)
                        return false

                    if ref is refLow
                        # We have to ensure that the minimal range is met if the current
                        # upper value minus the new lower value is smaller than the minimal
                        # range.
                        ensureMinRange = scope[refHigh] - newValue < minRange
                    else
                        # We have to ensure that the minimal range is met if the new upper
                        # value minus the current lower value is smaller than the minimal
                        # range.
                        ensureMinRange = newValue - scope[refLow] < minRange

                    if fixedRange or ensureMinRange
                        # We have to set both refLow and refHigh if a fixedRange is set, so
                        # we handle this entirely different from the other cases.
                        #
                        if ref is refLow
                            # The user moves the lower end. Hence we set newLow to the new
                            # value and newHigh to the lower end plus the width of the
                            # (fixed or minimal) range.
                            newHigh = newValue + (fixedRange || minRange)
                            newLow = newValue

                            # newHigh might now exceed the maximum value. In this case we
                            # have to move both newLow and newHigh to the left.
                            if newHigh > maxValue
                                newLow -= newHigh - maxValue
                                newLow = Math.max minValue, newLow

                                newHigh = maxValue
                        else
                            # The user moves the upper end.
                            newHigh = newValue
                            newLow = newValue - (fixedRange || minRange)

                            # newLow might be smaller than the minimum value. We have to
                            # adjust both sliders in this case.
                            if newLow < minValue
                                newHigh += minValue - newLow
                                newHigh = Math.min maxValue, newHigh

                                newLow = minValue

                        newHigh = roundStep(newHigh, parseInt(scope.precision), parseFloat(scope.step), parseFloat(scope.floor))
                        scope[refHigh] = newHigh

                        newLow = roundStep(newLow, parseInt(scope.precision), parseFloat(scope.step), parseFloat(scope.floor))
                        scope[refLow] = newLow

                bindPointerEvents = (pointer, ref, events) ->
                    onEnd = ->
                        ptr.removeClass 'active' for ptr in [minPtr, maxPtr]
                        ngDocument.unbind events.move
                        ngDocument.unbind events.end
                    onMove = (event) ->
                        eventX = getPointerOffset(orientation, event)
                        newOffset = eventX - pointerHalfWidth

                        if isHorizontal orientation
                            newOffset -= element[0].getBoundingClientRect().left
                        else
                            newOffset -= element[0].getBoundingClientRect().top
                        newPercent = percentOffset newOffset
                        newValue = minValue + (valueRange * newPercent / 100.0)
                        if range and not ensureMinAndFixedRange ref, newValue
                            if ref is refLow
                                if newValue > scope[refHigh]
                                    ref = refHigh
                                    minPtr.removeClass 'active'
                                    maxPtr.addClass 'active'
                            else
                                if newValue < scope[refLow]
                                    ref = refLow
                                    maxPtr.removeClass 'active'
                                    minPtr.addClass 'active'
                            newValue = roundStep(newValue, parseInt(scope.precision), parseFloat(scope.step), parseFloat(scope.floor))
                            scope[ref] = newValue
                        else
                            newValue = roundStep(newValue, parseInt(scope.precision), parseFloat(scope.step), parseFloat(scope.floor))
                            scope[ref] = newValue

                        checkConstraint ref
                        scope.$apply()
                    onStart = (event) ->
                        pointer.addClass 'active'
                        dimensions()
                        event.stopPropagation()
                        event.preventDefault()
                        ngDocument.bind events.move, onMove
                        ngDocument.bind events.end, onEnd
                    pointer.bind events.start, onStart

                bindSelectionBarEvents = (selBar, events) ->
                    offsetPointerStart = undefined
                    offsetLowStart = undefined
                    offsetHighStart = undefined

                    onStart = (event) ->
                        event.stopPropagation()
                        event.preventDefault()

                        offsetPointerStart = getPointerOffset(orientation, event)
                        offsetLowStart = parseInt percentToOffset percentValue scope[refLow], 10
                        offsetHighStart = parseInt percentToOffset percentValue scope[refHigh], 10

                        ngDocument.bind events.move, onMove
                        ngDocument.bind events.end, onEnd

                    onMove = (event) ->
                        offsetPointerCurrent = getPointerOffset(orientation, event)
                        offsetPointerDelta = offsetPointerCurrent - offsetPointerStart

                        offsetLowCurrent = offsetLowStart + offsetPointerDelta
                        offsetHighCurrent = offsetHighStart + offsetPointerDelta

                        if offsetLowCurrent < minOffset
                            offsetLowCurrent = minOffset
                            offsetHighCurrent = offsetLowCurrent + (offsetHighStart - offsetLowStart)

                        if offsetHighCurrent > maxOffset
                            offsetHighCurrent = maxOffset
                            offsetLowCurrent = offsetHighCurrent + (offsetLowStart - offsetHighStart)

                        valueLowCurrent = percentToValue percentOffset offsetLowCurrent
                        valueHighCurrent = percentToValue percentOffset offsetHighCurrent

                        scope[refLow] = valueLowCurrent
                        scope[refHigh] = valueHighCurrent

                        scope.$apply()

                    onEnd = () ->
                        ngDocument.unbind events.move
                        ngDocument.unbind events.end

                    selBar.bind events.start, onStart

                setBindings = ->
                    boundToInputs = true
                    bind = (method) ->
                        bindPointerEvents minPtr, refLow, inputEvents[method]
                        bindPointerEvents maxPtr, refHigh, inputEvents[method]
                    bind(inputMethod) for inputMethod in ['touch', 'mouse']

                    if range
                        ((method) ->
                            bindSelectionBarEvents selDragHandleBar, inputEvents[method]
                        )(inputMethod) for inputMethod in ['touch', 'mouse']

                if checkRangeConstraints()
                    scope.$apply()

                setPointers()
                adjustBubbles()
                ensureMinAndFixedRange(refLow, parseInt scope[refLow], 10)
                setBindings() unless boundToInputs

            $timeout updateDOM
            scope.$watch w, updateDOM for w in watchables
            window.addEventListener "resize", updateDOM

qualifiedDirectiveDefinition = [
    '$timeout'
    sliderDirective
]

module = (window, angular) ->
    angular
        .module(MODULE_NAME, [])
        .directive(SLIDER_TAG, qualifiedDirectiveDefinition)

module window, window.angular