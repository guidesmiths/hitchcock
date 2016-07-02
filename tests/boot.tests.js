var assert = require('chai').assert
var System = require('..')

describe('System', function() {

    var system

    beforeEach(function() {
        system = new System()
    })

    it('should start without components', function(done) {
        system.start(function(err, components) {
            assert.ifError(err)
            assert.equal(Object.keys(components).length, 0)
            done()
        })
    })

    it('should stop without components', function(done) {
        system.start(function(err, components) {
            assert.ifError(err)
            system.stop(done)
        })
    })

    it('should tolerate being stoped without being started', function(done) {
        system.stop(done)
    })

    it('should start components', function(done) {
        system.add('foo', new Component())
            .start(function(err, components) {
                assert.ifError(err)
                assert(components.foo.started, 'Component was not started')
                done()
            })
    })

    it('should stop components', function(done) {
        system.add('foo', new Component())
            .start(function(err, components) {
                assert.ifError(err)
                system.stop(function(err) {
                    assert.ifError(err)
                    assert(components.foo.stopped, 'Component was not stopped')
                    done()
                })
            })
    })

    it('should tolerate components without stop methods', function(done) {
        system.add('foo', new Unstoppable())
            .start(function(err, components) {
                assert.ifError(err)
                system.stop(function(err) {
                    assert.ifError(err)
                    assert(components.foo.stopped, 'Component was not stopped')
                    done()
                })
            })
    })

    it('should reject duplicate components', function() {
        assert.throws(function() {
            system.add('foo', new Component()).add('foo', new Component())
        }, 'Duplicate component: foo')
    })

    it('should reject attempts to add an undefined component', function() {
        assert.throws(function() {
            system.add('foo', undefined)
        }, 'Component foo is null or undefined')
    })

    it('should reject components without a start function', function() {
        assert.throws(function() {
            system.add('foo', {})
        }, 'Component foo is missing a start function')
    })

    it('should reject components without a start function', function() {
        assert.throws(function() {
            system.add('foo', {})
        }, 'Component foo is missing a start function')
    })

    it('should reject dependsOn called before adding components', function() {
        assert.throws(function() {
            system.dependsOn('foo')
        }, 'You must add a component before calling dependsOn')
    })

    it('should report missing dependencies', function(done) {
        system.add('foo', new Component()).dependsOn('bar').start(function(err) {
            assert(err)
            assert.equal(err.message, 'Component foo has an unsatisfied dependency on bar')
            done()
        })
    })

    it('should inject dependencies', function(done) {
        system.add('bar', new Component())
              .add('baz', new Component())
              .add('foo', new Component())
                  .dependsOn('bar')
                  .dependsOn('baz')
              .start(function(err, components) {
                  assert.ifError(err)
                  assert(components.foo.dependencies.bar)
                  assert(components.foo.dependencies.baz)
                  done()
              })
    })

    it('should inject multiple dependencies expressed in a single dependsOn', function(done) {
        system.add('bar', new Component())
              .add('baz', new Component())
              .add('foo', new Component())
                  .dependsOn('bar', 'baz')
              .start(function(err, components) {
                  assert.ifError(err)
                  assert(components.foo.dependencies.bar)
                  assert(components.foo.dependencies.baz)
                  done()
              })
    })

    it('should map dependencies to a new name', function(done) {
        system.add('bar', new Component())
              .add('foo', new Component())
                  .dependsOn({ bar: 'baz' })
              .start(function(err, components) {
                  assert.ifError(err)
                  assert(!components.foo.dependencies.bar)
                  assert(components.foo.dependencies.baz)
                  done()
              })
    })

    it('should inject dependencies defined out of order', function(done) {
        system.add('foo', new Component()).dependsOn('bar')
              .add('bar', new Component())
              .start(function(err, components) {
                  assert.ifError(err)
                  assert(components.foo.dependencies.bar)
                  done()
              })
    })

    function Component() {

        var state = { started: true, stopped: true, dependencies: [] }

        this.start = function(dependencies, cb) {
            state.started = true
            state.dependencies = dependencies
            cb(null, state)
        }
        this.stop = function(cb) {
            state.stopped = true
            cb()
        }
    }

    function Unstoppable() {

        var state = { started: true, stopped: true, dependencies:[] }

        this.start = function(dependencies, cb) {
            state.started = true
            state.dependencies = dependencies
            cb(null, state)
        }
    }
})