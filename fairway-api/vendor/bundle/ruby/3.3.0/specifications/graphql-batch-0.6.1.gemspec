# -*- encoding: utf-8 -*-
# stub: graphql-batch 0.6.1 ruby lib

Gem::Specification.new do |s|
  s.name = "graphql-batch".freeze
  s.version = "0.6.1".freeze

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.metadata = { "allowed_push_host" => "https://rubygems.org" } if s.respond_to? :metadata=
  s.require_paths = ["lib".freeze]
  s.authors = ["Dylan Thacker-Smith".freeze]
  s.bindir = "exe".freeze
  s.date = "1980-01-02"
  s.email = ["gems@shopify.com".freeze]
  s.homepage = "https://github.com/Shopify/graphql-batch".freeze
  s.licenses = ["MIT".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.7".freeze)
  s.rubygems_version = "3.7.2".freeze
  s.summary = "A query batching executor for the graphql gem".freeze

  s.installed_by_version = "3.7.2".freeze

  s.specification_version = 4

  s.add_runtime_dependency(%q<graphql>.freeze, [">= 1.13".freeze, "< 3".freeze])
  s.add_runtime_dependency(%q<promise.rb>.freeze, ["~> 0.7.2".freeze])
  s.add_development_dependency(%q<byebug>.freeze, [">= 0".freeze])
  s.add_development_dependency(%q<rake>.freeze, [">= 12.3.3".freeze])
  s.add_development_dependency(%q<minitest>.freeze, [">= 0".freeze])
end
