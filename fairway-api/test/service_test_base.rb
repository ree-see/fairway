require 'test_helper'

class ServiceTestBase < ActiveSupport::TestCase
  # Disable fixtures for service tests
  def self.fixture_path
    nil
  end
  
  # Override the fixtures method to do nothing
  def self.fixtures(*args)
    # Do nothing - we don't want fixtures loaded
  end
  
  def setup
    # Clean up any data from previous tests
    cleanup_test_data
    super if defined?(super)
  end
  
  def teardown
    cleanup_test_data
    super if defined?(super)
  end
  
  private
  
  def cleanup_test_data
    # Clean up in reverse dependency order
    HoleScore.delete_all
    Round.delete_all
    Hole.delete_all
    Course.delete_all
    User.delete_all
  end
end