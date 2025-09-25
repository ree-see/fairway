FactoryBot.define do
  factory :failed_job do
    job_class { "MyString" }
    job_id { "MyString" }
    arguments { "MyText" }
    error_class { "MyString" }
    error_message { "MyText" }
    error_backtrace { "MyText" }
    failed_at { "2025-09-25 10:35:40" }
    executions { 1 }
  end
end
