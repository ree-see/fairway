require 'test_helper'

class CoursesSyncJobTest < ActiveJob::TestCase
  def setup
    @job = CoursesSyncJob.new
  end

  test "performs initial sync correctly" do
    # Mock the CoursesSyncService
    mock_service = Minitest::Mock.new
    mock_service.expect :initial_sync, { synced: 5, errors: 0 }, [limit: nil]
    
    CoursesSyncService.stub :new, mock_service do
      result = @job.perform('initial')
      
      assert_equal 5, result[:synced]
      assert_equal 0, result[:errors]
    end
    
    mock_service.verify
  end

  test "performs update sync correctly" do
    # Mock the CoursesSyncService
    mock_service = Minitest::Mock.new
    mock_service.expect :update_sync, { synced: 3, errors: 1 }
    
    CoursesSyncService.stub :new, mock_service do
      result = @job.perform('update')
      
      assert_equal 3, result[:synced]
      assert_equal 1, result[:errors]
    end
    
    mock_service.verify
  end

  test "performs initial sync with limit" do
    # Mock the CoursesSyncService
    mock_service = Minitest::Mock.new
    mock_service.expect :initial_sync, { synced: 10, errors: 0 }, [limit: 10]
    
    CoursesSyncService.stub :new, mock_service do
      result = @job.perform('initial', { 'limit' => 10 })
      
      assert_equal 10, result[:synced]
      assert_equal 0, result[:errors]
    end
    
    mock_service.verify
  end

  test "raises error for unknown sync type" do
    assert_raises ArgumentError do
      @job.perform('unknown_type')
    end
  end

  test "job is enqueued correctly" do
    assert_enqueued_with(job: CoursesSyncJob, args: ['update']) do
      CoursesSyncJob.perform_later('update')
    end
  end

  test "job is enqueued with options correctly" do
    assert_enqueued_with(job: CoursesSyncJob, args: ['initial', { 'limit' => 100 }]) do
      CoursesSyncJob.perform_later('initial', { 'limit' => 100 })
    end
  end

  test "job retries on failure" do
    # Mock service to raise an error
    mock_service = Minitest::Mock.new
    mock_service.expect :update_sync, proc { raise StandardError, "API failure" }
    
    CoursesSyncService.stub :new, mock_service do
      assert_raises StandardError do
        @job.perform('update')
      end
    end
    
    mock_service.verify
  end
end